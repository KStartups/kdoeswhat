# Slicey.co Campaign Statistics Auditor

## Project Overview
Slicey.co is a web application designed to audit and analyze email marketing campaign statistics across multiple sequencing platforms. It provides a unified interface to fetch, compare, and visualize campaign performance metrics.

## Current Supported Platforms
- Smartlead.ai
- Pipl.ai
- Instantly.ai

## Key Features

### Campaign Statistics Tracking
- Fetch campaign statistics via API
- Support for multiple email sequencing platforms
- Detailed campaign performance metrics

#### Metrics Tracked
- Prospects Emailed
- Total Replies
- Positive Replies
- Reply Rates
- Positive Reply Rates
- Pipeline Value (Pipl.ai specific)

### User Interface
- Multi-step workflow
  1. API Key Input
  2. Campaign Selection
  3. Campaign Statistics Display

### Unique Capabilities
- Cross-platform campaign comparison
- Combined campaign statistics view
- Optional pipeline value display
- Responsive design for mobile and desktop

## Technical Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui components

## Planned Features & Roadmap

### Short-term Enhancements
- [ ] Add more detailed error handling
- [ ] Implement local storage for API keys
- [ ] Create export functionality for campaign reports
- [ ] Add more comprehensive tooltips and help text

### Mid-term Goals
- [ ] Support additional email sequencing platforms
- [ ] Implement advanced filtering and sorting of campaigns
- [ ] Create historical trend analysis
- [ ] Add authentication and user accounts

### Long-term Vision
- [ ] Machine learning-powered campaign insights
- [ ] Predictive performance modeling
- [ ] Integration with CRM systems
- [ ] Advanced reporting and visualization

## Current Limitations
- Requires manual API key input for each session
- Limited to 90-day campaign data
- Platform-specific metric variations

## Development Setup
1. Clone the repository
2. Run `npm install`
3. Set up environment variables for API endpoints
4. Run `npm run dev` to start development server

## Contribution Guidelines
- Follow TypeScript best practices
- Maintain consistent UI/UX with Shadcn design system
- Write comprehensive tests for new features
- Update documentation with each significant change

## Known Issues
- Potential inconsistencies in API response parsing
- Limited error handling for edge cases
- Performance considerations with large campaign datasets

## Future Exploration
- Serverless backend for API aggregation
- Real-time campaign tracking
- Multi-platform dashboard
- Advanced data visualization techniques

## Version History
- v0.1.0: Initial release with Smartlead, Pipl, and Instantly support
- v0.2.0: (Planned) Enhanced error handling and export features

## License
[To be determined - add specific license information]

## Contact & Support
For issues, feature requests, or collaboration:
- Email: support@slicey.co
- GitHub Issues: [Repository Link] 