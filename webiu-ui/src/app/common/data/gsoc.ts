export const gsocData = {
  introHTML: `
<p>🚀 We’re excited to participate in GSoC for the 11th time, providing students and contributors with an opportunity to learn, collaborate, and contribute to impactful open-source projects.</p>

<p>🌟 <strong>Become a GSoC Contributor</strong><br />
Are you new to open source and looking for exciting projects to contribute to? Google Summer of Code (GSoC) is the perfect opportunity! With the guidance of experienced mentors, you’ll gain hands-on experience working on real-world projects.</p>

<p>👉 <strong>Why should you engage early?</strong><br />
It’s very important to connect with organizations as soon as possible. The more you interact with mentors and the community before submitting your proposal, the better your chances of being selected for GSoC!</p>

<p>🎥 Want to learn more about Google Summer of Code?</p>

<ul>
  <li><a href="https://www.youtube.com/watch?v=7jD2tChhrWM" target="_blank">An introduction to Google Summer of Code</a></li>
  <li><a href="https://youtu.be/YN7uGCg5vLg" target="_blank">Learn how to apply as a GSoC contributor</a></li>
</ul>

<p>🔹<strong>Who Can Contribute?</strong></p>

<p>Anyone interested is welcome to participate—whether you’re a <strong>GSoC student, mentor, or simply passionate about open-source development!</strong></p>

<p>🔹 <strong>How to Contribute to a Project</strong></p>
<ol>
  <li>Select a project idea from the list below.</li>
  <li>Engage with mentors and explore the project code.</li>
  <li>Submit a small contribution to demonstrate your understanding.</li>
  <li>Interact with mentors for feedback and improvements.</li>
  <li>Prepare your proposal and submit it to Google Summer of Code.
<br /></li>
</ol>

<p>📢 Join Our Community</p>

<p>💬 Slack: <a href="https://join.slack.com/t/c2si-org/shared_invite/zt-3qja11cmu-m4tbWB9E8M18_s6srLlHbg" target="_blank">C2SI Slack Workspace</a><br />
📝 Proposal Template: <a href="https://shorturl.at/dtR23" target="_blank">View Here</a><br />
💻 Explore Our Projects: <a href="https://github.com/c2siorg" target="_blank">C2SI GitHub Repository</a><br /></p>

<p>Let’s build something great together! 🚀</p>

<p><br /></p>

<h2 class="idea-list-header">Idea List for 2026</h2>
`,
  projects: [
    {
      id: 1,
      title: 'B0Bot',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Hardik Jindal (hardik1408), Nipuna</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Hard</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#b0bot</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>B0Bot is a CyberSecurity News API tailored for automated bots on social media platforms. It is a cutting-edge Flask-based API that grants seamless access to the latest cybersecurity and hacker news. Users can effortlessly retrieve news articles either through specific keywords or without, streamlining the information acquisition process. Once a user requests our API, it retrieves news data from our knowledge base and feeds it to the LLM. After the LLM processes the data, the API obtains the response and returns it in JSON format. The API is powered by LangChain and a Huggingface endpoint, ensuring that users receive accurate and up-to-date information.</p>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      This year, we are planning to integrate the following features into b0bot:
    <ul>
      <li>Implement CDC via RSS feed readers or debezium connectors with kafka bus.</li>
      <li>Implement caching mechanisms (e.g. Redis) to reduce response time for frequent requests.</li>
      <li>Add a subscription feature for users to receive daily or weekly summaries, over email.</li>
      <li>Create an agentic AI framework using Langchain/LangGraph to create planner and executor agents. Example of possible agents can be scraper agent, responder agent, notification agent, analyzer agent. Thorough research is expected from the contributor before deciding the agentic framework.</li>
      <li>Extend the LLM to support multi-turn dialogue, allowing users to engage in conversational interactions with the API.</li>
      <li>Extend data sources to various social media websites by using their APIs.</li>
      <li>Creating tests for the API and proper error handling.</li>
      <li>Improved UI, possibly creating a dashboard.
</li>
    </ul>
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Python, Large Language Models, Huggingface, LangChain, Database management, Pinecone, Flask, Agentic Frameworks</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/b0bot" target="_blank">https://github.com/c2siorg/b0bot</a></p>
    </div>
</div>`,
    },
    {
      id: 2,
      title: 'WebiU',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Mahender Goud Thanda (Maahi10001), Charith</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Medium</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#WebiU</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>WebiU is a dynamic organization website built using reusable component architecture that fetches project data in real time from GitHub repositories, ensuring live updates without manual intervention. It provides configurable templates to showcase project details such as title, description, technology stack, demo links, and organization updates.

The project aims to further improve the platform by optimizing APIs for faster and lighter responses, exploring serverless backend solutions for scalable real-time data handling, integrating CI/CD workflows, and introducing lightweight AI features to enhance project presentation and discoverability without increasing system complexity.</p>
    </div>
    <div class="content-section">
      <h4>Key Objectives</h4>
      <ol>
      <li><em>API Optimization</em>
        <ul>
          <li>Refactor APIs to reduce response times and payload sizes.</li>
          <li>Implement in-memory caching and compression (e.g., GZIP).</li>
          <li>Explore GraphQL for efficient data fetching.
    </li>
        </ul>
      </li>
      <li><em>Alternative Backend Strategies</em>
        <ul>
          <li>Leverage serverless architectures for scalable real-time data processing.
    </li>
        </ul>
      </li>
      <li><em>CI/CD Integration</em>
        <ul>
          <li>Automate testing, building, and deployment with tools like GitHub Actions.</li>
          <li>Enable safe deployments with rollback and error handling.
    </li>
        </ul>
      </li>
      <li><em>Admin Features</em>
        <ul>
          <li>Extend admin controls with project analytics.</li>
          <li>Provide manual API and AI content refresh options.
    </li>
        </ul>
      </li>
      <li><em>AI Enhancements</em>
        <ul>
          <li>Generate concise project summaries from GitHub README and metadata</li>
          <li>Detect technology stack automatically for accurate tech badges and filtering</li>
          <li>Enable optional natural-language project search mapped to existing metadata</li>
          <li>Cache AI outputs and refresh only on repository updates
    </li>
        </ul>
      </li>
    </ol>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      By the end of the summer, WebiU will be production-ready with optimized APIs, a scalable real-time architecture, automated CI/CD workflows, and selective AI enhancements. These improvements will reduce manual effort, improve project discovery, and deliver a cleaner, faster, and more maintainable platform.
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>REST/GraphQL, GitHub APIs, Node.js &amp; Serverless, Angular, CI/CD (GitHub Actions), Basic API-based AI integration.</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/Webiu" target="_blank">https://github.com/c2siorg/Webiu</a></p>
    </div>
</div>`,
    },
    {
      id: 3,
      title: 'GDB UI',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Shubh Mehta (Shubh942), Nipuna, EMSDV</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Medium</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#gdb-ui</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>GDB-UI is a modern, web-based interface for the GNU Debugger (GDB), designed to simplify the debugging process for developers working with C, and C++. It provides real-time interaction with GDB, enabling features like monitoring program execution, inspecting variables, setting breakpoints, and more, all through an intuitive web application.

GDB-UI enhances the debugging workflow by offering a sleek, user-friendly UI, replacing the traditional command-line experience with a visual and accessible alternative. It supports both Docker-based and manual setups, allowing seamless integration into various development environments.</p>
    </div>
    <div class="content-section">
      <h4>Key Objectives</h4>
      <ol>
      <li><em>First Deployment:</em>
        <ul>
          <li>Deploy the project for initial use, ensuring the application is accessible and functional for all users.
    </li>
        </ul>
      </li>
      <li><em>CI/CD Integration:</em>
        <ul>
          <li>Automate the testing, building, and deployment processes using tools like GitHub Actions.</li>
          <li>Ensure smooth deployment pipelines with robust rollback mechanisms and proper error handling.
    </li>
        </ul>
      </li>
      <li><em>Session Management for Multiuser Support:</em>
        <ul>
          <li>Implement a system to store debugging sessions uniquely for each user to enable multiuser functionality.</li>
          <li>Ensure session persistence and isolation to prevent interference between users.
    </li>
        </ul>
      </li>
      <li><em>Real-Time Debugging Results:</em>
        <ul>
          <li>Design the application to display debugger results in real time without requiring page refreshes.</li>
          <li>Use WebSockets or similar technologies to handle live updates efficiently.
    </li>
        </ul>
      </li>
    </ol>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      By the completion of the project, the application will be fully deployed with multiuser support, persistent session management, real-time debugging results, and a robust CI/CD pipeline. These enhancements will provide a seamless debugging experience, improve scalability, and simplify the development workflow for contributors.
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Proficiency in REST, Flask, React, WebSockets, Docker, CI/CD tools (e.g., GitHub Actions), session management, and real-time data handling</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/GDB-UI" target="_blank">https://github.com/c2siorg/GDB-UI</a></p>
    </div>
</div>`,
    },
    {
      id: 4,
      title: 'CodeLabz',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Mallepally Lokeshwar Reddy(lokeshwar777), Utkarsh Raj(rajutkarsh07)</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Medium</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#codelabz</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>CodeLabz is an interactive, cloud-based learning platform designed to facilitate engagement with online tutorials. It enables organizations to create, manage, and share structured learning resources with users. The platform is built with a ReactJS frontend, complemented by a scalable backend powered by Google Cloud Firestore and Firebase Realtime Database, ensuring seamless real-time data synchronization and an intuitive user experience.

This project focuses on optimizing learning workflows by integrating an enhanced UI, efficient data management, and dynamic real-time updates. CodeLabz serves as a centralized solution for tutorial creation, consumption, and collaboration, ensuring an effective and scalable educational experience. It currently requires the following improvements.</p>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      By the completion of this project, CodeLabz will achieve:
    <ul>
      <li><em>Optimized API performance:</em> Faster response times, reduced server load, and enhanced data retrieval, improving overall API performance.</li>
      <li><em>Better looking UI/UX:</em> A visually appealing and responsive interface that works seamlessly across all devices, improving user satisfaction.</li>
      <li><em>Scalable real-time backend:</em> A scalable, serverless backend that handles real-time data synchronization and notifications efficiently.</li>
      <li><em>Refined CI/CD pipelines and faster deployment cycles:</em>  Improved consistency and reproducibility of environments through Docker.</li>
      <li><em>Enhanced data security and privacy:</em> Improved data security with role-based access control, ensuring only authorized users access sensitive information.</li>
      <li><em>Improved admin functionality:</em> Advanced analytics, data monitoring, and administrative control tools.</li>
      <li><em>Updated and consistent codebase:</em> Fully migrated, consistent, scalable and maintainable codebase.
</li>
    </ul>
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Proficiency in React.js, Redux, Material-UI, TypeScript, Node.js, Express.js, Firebase, API design, Docker, CI/CD (GitHub Actions), Figma, NoSQL design patterns, query optimization, caching strategies, OAuth, and Role-Based Access Control (RBAC).</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/codelabz" target="_blank">https://github.com/c2siorg/codelabz</a></p>
    </div>
</div>`,
    },
    {
      id: 5,
      title: 'ImageLab - Improve user experience',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Oshan, Charitha</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Medium</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#imagelab</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>ImageLab is a standalone tool designed to help users learn and experiment with image processing techniques interactively. It provides an intuitive environment for beginners to understand image processing concepts without deep programming knowledge. Advanced users can use ImageLab as a test environment before implementing actual image processing applications.</p>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      The goal of this year is to improve the ImageLab experience for the users and the developers alike.

    <ul>
      <li>Make the UI responsive.</li>
      <li>Fix the UI/UX issues in the current project such as tooltips not being displayed correctly.</li>
      <li>Increase the library of the blocks / parameters of operations.</li>
      <li>Come up with a deployment/release strategy.</li>
      <li>Complete the documentation on the project to support both users and developers, making it easier to understand, contribute to, and maintain the project.</li>
      <li>Transition the application’s architecture from an experiment-centric to a project-based approach.</li>
      <li>Develop a project library for easy management and retrieval of user projects.</li>
      <li>Implement features to collect user analytics and feedback within the application.</li>
      <li>(Optional) Build features necessary for creating object detection pipelines.
</li>
    </ul>
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Javascript / Typescript, OpenCV, Electron (Optional)</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/imagelab" target="_blank">https://github.com/c2siorg/imagelab</a></p>
    </div>
</div>`,
    },
    {
      id: 6,
      title: 'DataLoom',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Oshan Mudannayake, Danushka V</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Easy</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#dataLoom</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>DataLoom is a web-based graphical interface designed to simplify data wrangling and transformation tasks for tabular datasets. It serves as an intuitive front-end for the pandas library, enabling users to perform complex data manipulation operations without requiring advanced programming expertise. By bridging the gap between data analysis and usability, DataLoom empowers users to streamline their data workflows efficiently.</p>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      <ul>
      <li>Redesign and modernize the UI to be more responsive, professional, and user-friendly.</li>
      <li>Introduce additional data transformation operations.</li>
      <li>Restructure the project to enhance readability, maintainability, and ease of contribution for new developers.
</li>
    </ul>
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Backend: Python, Pandas, FastAPI (recommended)
Frontend: HTML, CSS, JavaScript, React (recommended)</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/dataloom" target="_blank">https://github.com/c2siorg/dataloom</a></p>
    </div>
</div>`,
    },
    {
      id: 7,
      title: 'TensorMap',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Oshan Mudannayake, Utkarsh Raj (rajutkarsh07), UdeshUK</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Hard</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#tensormap</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>TensorMap is a web application that will allow the users to create machine learning algorithms visually. TensorMap supports reverse engineering of the visual layout to a Tensorflow implementation in preferred languages. The goal of the project is to let the beginners play with machine learning algorithms in Tensorflow without less background knowledge about the library.</p>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      <ul>
      <li>Clean up the project structure.</li>
      <li>Completely switch to poetry for dependency management.</li>
      <li>Complete the project Wiki.</li>
      <li>Implement additional visualizations such as 3D plots, heatmaps, and interactive graphs.</li>
      <li>Add built-in functions for common data augmentation techniques.</li>
      <li>Add more functionality to the application (open-ended).
</li>
    </ul>
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Tensorflow, Python, Javascript</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/tensormap" target="_blank">https://github.com/c2siorg/tensormap</a></p>
    </div>
</div>`,
    },
    {
      id: 8,
      title: 'Honeynet',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Danushka V, WiztaMax, Keneth</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Easy</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#Honeynet</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>Develop a scalable, cloud-native honeypot deployment framework that leverages Terraform to provision and manage honeypot instances across multiple geographic regions. This platform will help security teams gather threat intelligence, understand attacker methodologies, and improve defensive postures by simulating realistic targets in various cloud environments.</p>
    </div>
    <div class="content-section">
      <h4>Key Objectives</h4>
      <ul>
      <li><em>Automated Deployment:</em> Use Terraform to automate the provisioning, configuration, and decommissioning of honeypot infrastructure across multiple regions and potentially multiple cloud providers.</li>
      <li><em>Distributed Architecture:</em> Deploy honeypots in various regions (e.g., North America, Europe, Asia-Pacific) to capture a diverse range of attack vectors and adapt to region-specific threat landscapes.</li>
      <li><em>Data Enrichment:</em> Integrate logging, monitoring, and analytics to enrich raw data, correlating attack patterns with global threat intelligence feeds.</li>
      <li><em>Scalability and Flexibility:</em> Implement modular Terraform configurations and cloud-native services to enable rapid scaling, dynamic resource allocation, and easy modifications.
</li>
    </ul>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      Check project GeoDNSScanner (<a href="https://github.com/c2siorg/GeoDnsScanner" target="_blank">https://github.com/c2siorg/GeoDnsScanner</a>), you will create something similar to this but to deploy honeypots
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Cloud deployment, Terraform, bash</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/honeynet" target="_blank">https://github.com/c2siorg/honeynet</a></p>
    </div>
</div>`,
    },
    {
      id: 9,
      title: 'RustCloud',
      detailsHTML: `<div class="project-details-grid">
  <div class="metadata-boxes">
      <div class="meta-box"><strong>Mentors</strong><span>Pratik Dhanave, Mohit Bhat</span></div>\n      <div class="meta-box"><strong>Length</strong><span>350 hours</span></div>\n      <div class="meta-box"><strong>Difficulty</strong><span>Medium</span></div>\n      <div class="meta-box"><strong>Slack</strong><span>#rust-cloud</span></div>
  </div>

    <div class="content-section">
      <h4>Brief Explanation</h4>
      <p>RustCloud is a rust library which hides the difference between different APIs provided by varied cloud providers (AWS, GCP, Azure etc.) and allows you to manage different cloud resources through a unified and easy to use API.</p>
    </div>
    <div class="content-section">
      <h4>Expected Results</h4>
      <ul>
  <li>By the end of the project, API for BigQuery, Vertex AI, GenAI for AWS, GCP, Azure</li>
  <li>Documentation -  Improve and maintain documentation related to the development areas, ensuring clarity for future contributors.
</li>
</ul>
    </div>
    <div class="content-section">
      <h4>Knowledge Prerequisite</h4>
      <p>Rust, AWS, GCP, Azure</p>
    </div>
    <div class="content-section">
      <h4>Github URL</h4>
      <p><a href="https://github.com/c2siorg/RustCloud" target="_blank">https://github.com/c2siorg/RustCloud</a></p>
    </div>
</div>`,
    },
  ],
};
