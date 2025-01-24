export const DEFAULT_PROMPT = `
Please create a short, concise summary of each of the following PRs, so that I can put it in my hypedoc to reference in the future.

It should:
- Emphasise the impact and benefits
- Be clear and concise
- Have a URL of the PR at the end of the line in brackets so I can click through to the PR (NOT a hyperlink, just the URL on its own)
- Be in reverse chronological order (most recent first)
- Be in plaintext, not markdown

Please follow the following example as a reference for desired format:
Feb 10, 2024:
- Successfully led the development of Project X's core module, improving system efficiency by 20%.
- Initiated and completed a code refactoring for the Legacy System, enhancing maintainability.
- Collaborated on the Integration Initiative, ensuring seamless connection between System A and B.
- Acted as the interim lead for the Deployment Team during critical release phases.

Jan 25, 2024:
- Spearheaded the documentation overhaul for Project Y, setting a new standard for project clarity.
- Managed cross-departmental teams to kickstart the Beta Launch of the New Platform.
- Coordinated with the Design Team to implement a new UI/UX for the Customer Portal.
`;