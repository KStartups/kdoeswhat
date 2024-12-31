import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify the JWT token and get the user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authorization token')
    }

    const { api_key, workspace_id } = await req.json()
    
    if (!api_key) {
      throw new Error('API key is required')
    }

    // Get sequencer from api_keys table
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('sequencer')
      .eq('api_key', api_key)
      .single()

    if (apiKeyError || !apiKeyData) {
      throw new Error('API key not found in database')
    }

    const sequencer = apiKeyData.sequencer

    if (sequencer === 'smartlead') {
      // Fetch campaigns from Smartlead
      const response = await fetch(`https://server.smartlead.ai/api/v1/campaigns?api_key=${api_key}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const campaigns = await response.json()
      console.log('Raw Campaigns Response:', campaigns)

      // Fetch analytics for each campaign and store them
      const transformedCampaigns = await Promise.all(
        campaigns.map(async (campaign: any) => {
          // Fetch analytics for this campaign
          const statsUrl = `https://server.smartlead.ai/api/v1/campaigns/${campaign.id}/analytics?api_key=${api_key}`
          const statsResponse = await fetch(statsUrl)
          const stats = await statsResponse.json()
          console.log('Campaign Analytics:', stats)

          const uniqueSentCount = parseInt(stats.unique_sent_count || '0', 10)
          const replyCount = parseInt(stats.reply_count || '0', 10)
          const interestedCount = parseInt(stats.campaign_lead_stats?.interested || '0', 10)
          const revenue = stats.campaign_lead_stats?.revenue || null

          // Store analytics in the database
          const { error: insertError } = await supabase
            .from('campaign_analytics')
            .upsert({
              campaign_id: campaign.id.toString(),
              sequencer: 'smartlead',
              user_id: user.id,
              api_key,
              name: stats.name,
              status: stats.status,
              sent_count: parseInt(stats.sent_count || '0', 10),
              unique_sent_count: uniqueSentCount,
              reply_count: replyCount,
              interested_count: interestedCount,
              total_count: parseInt(stats.total_count || '0', 10),
              bounce_count: parseInt(stats.bounce_count || '0', 10),
              unsubscribed_count: parseInt(stats.unsubscribed_count || '0', 10),
              revenue: revenue,
              data_fetched_at: new Date().toISOString()
            })

          if (insertError) {
            console.error('Error storing analytics:', insertError)
            throw insertError
          }

          // Return transformed data for frontend
          return {
            id: campaign.id,
            name: stats.name,
            replyRate: uniqueSentCount > 0 ? (replyCount / uniqueSentCount) * 100 : 0,
            positiveRate: replyCount > 0 ? (interestedCount / replyCount) * 100 : 0,
            stats: {
              prospectsEmailed: uniqueSentCount,
              replies: replyCount,
              positiveReplies: interestedCount,
              name: stats.name,
              id: campaign.id,
              ...(revenue ? { pipelineValue: revenue } : {})
            }
          }
        })
      )

      // Update combined stats after storing new data
      await supabase.rpc('update_combined_stats')

      return new Response(JSON.stringify(transformedCampaigns), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (sequencer === 'pipl') {
      if (!workspace_id) {
        throw new Error('Workspace ID is required for Pipl')
      }

      // Get current date range
      const end_date = new Date().toISOString().split('T')[0]
      const start_date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch campaigns from Pipl
      const statsUrl = `https://api.pipl.ai/api/v1/analytics/campaign/stats?api_key=${api_key}&workspace_id=${workspace_id}&start_date=${start_date}&end_date=${end_date}`
      const statsResponse = await fetch(statsUrl)
      
      if (!statsResponse.ok) {
        throw new Error(`Error ${statsResponse.status}: ${await statsResponse.text()}`)
      }

      const campaigns = await statsResponse.json()
      console.log('Pipl Campaigns:', campaigns)

      // Transform and store each campaign
      const transformedCampaigns = await Promise.all(
        campaigns.map(async (campaign: any) => {
          // Store analytics in the database
          const { error: insertError } = await supabase
            .from('campaign_analytics')
            .upsert({
              campaign_id: campaign._id,
              sequencer: 'pipl',
              user_id: user.id,
              api_key,
              name: campaign.camp_name,
              status: campaign.status,
              sent_count: campaign.sent_count,
              unique_sent_count: campaign.lead_contacted_count,
              reply_count: campaign.replied_count,
              interested_count: campaign.positive_reply_count,
              total_count: campaign.lead_count,
              bounce_count: campaign.bounced_count,
              unsubscribed_count: 0,
              revenue: campaign.opportunity_val || null,
              data_fetched_at: new Date().toISOString()
            })

          if (insertError) {
            console.error('Error storing analytics:', insertError)
            throw insertError
          }

          // Return transformed data for frontend
          const uniqueSentCount = campaign.lead_contacted_count
          const replyCount = campaign.replied_count
          const interestedCount = campaign.positive_reply_count

          return {
            id: campaign._id,
            name: campaign.camp_name,
            replyRate: uniqueSentCount > 0 ? (replyCount / uniqueSentCount) * 100 : 0,
            positiveRate: replyCount > 0 ? (interestedCount / replyCount) * 100 : 0,
            stats: {
              prospectsEmailed: uniqueSentCount,
              replies: replyCount,
              positiveReplies: interestedCount,
              name: campaign.camp_name,
              id: campaign._id,
              ...(campaign.opportunity_val ? { pipelineValue: campaign.opportunity_val } : {})
            }
          }
        })
      )

      // Update combined stats after storing new data
      await supabase.rpc('update_combined_stats')

      return new Response(JSON.stringify(transformedCampaigns), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid sequencer specified')

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 