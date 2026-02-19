import { publicationsData } from '../../page/publications/publications-data';
import { projectsData } from '../../page/projects/projects-data';

export const HomepageDetails = {
  hero: {
    title: 'Welcome to C2SI',
    subtitle: 'Ceylon Computer Science Institute',
    description:
      'Pioneering the Future of Technology. Our dedicated research spans the cutting-edge realms of cybersecurity, privacy, artificial intelligence, internet innovations, digital forensics, mobile and cloud computing, and advanced software tools.',
    primaryCTA: {
      text: 'Explore Projects',
      link: '/projects',
    },
    secondaryCTA: {
      text: 'Join Community',
      link: '/community',
    },
  },

  mission: {
    title: 'Our Mission',
    description:
      'We are committed to advancing computer science research and fostering a vibrant community of developers, researchers, and innovators. Join us as we forge new paths in the digital world, ensuring a safer, smarter, and more connected future.',
  },

  stats: [
    {
      label: 'Active Projects',
      value: projectsData.repositories.length.toString(),
      icon: 'projects',
    },
    {
      label: 'Contributors',
      value: '150+',
      icon: 'contributors',
    },
    {
      label: 'Research Areas',
      value: '8+',
      icon: 'prs',
    },
    {
      label: 'Publications',
      value: '15+',
      icon: 'publications',
    },
  ],

  featuredProjects: [
    {
      name:
        projectsData.repositories.find((repo) => repo.name === 'Scan8')?.name ||
        'Scan8',
      description:
        projectsData.repositories.find((repo) => repo.name === 'Scan8')
          ?.description || '',
      language:
        projectsData.repositories.find((repo) => repo.name === 'Scan8')
          ?.language || 'Python',
      topics:
        projectsData.repositories
          .find((repo) => repo.name === 'Scan8')
          ?.topics.slice(0, 3) || [],
      stars:
        projectsData.repositories.find((repo) => repo.name === 'Scan8')
          ?.stargazers_count || 0,
      link:
        projectsData.repositories.find((repo) => repo.name === 'Scan8')
          ?.html_url || 'https://github.com/c2siorg/Scan8',
    },
    {
      name:
        projectsData.repositories.find((repo) => repo.name === 'Webiu')?.name ||
        'Webiu',
      description:
        'A modern web platform for managing and showcasing open-source projects, contributors, and publications.',
      language: 'TypeScript',
      topics: ['angular', 'nestjs', 'web-platform'],
      stars:
        projectsData.repositories.find((repo) => repo.name === 'Webiu')
          ?.stargazers_count || 0,
      link:
        projectsData.repositories.find((repo) => repo.name === 'Webiu')
          ?.html_url || 'https://github.com/c2siorg/Webiu',
    },
    {
      name:
        projectsData.repositories.find((repo) => repo.name === 'OpenMF')
          ?.name || 'OpenMF',
      description:
        projectsData.repositories.find((repo) => repo.name === 'OpenMF')
          ?.description || '',
      language:
        projectsData.repositories.find((repo) => repo.name === 'OpenMF')
          ?.language || 'JavaScript',
      topics: ['forensics', 'mobile', 'android'],
      stars:
        projectsData.repositories.find((repo) => repo.name === 'OpenMF')
          ?.stargazers_count || 0,
      link:
        projectsData.repositories.find((repo) => repo.name === 'OpenMF')
          ?.html_url || 'https://github.com/c2siorg/OpenMF',
    },
  ],

  recentPublications: publicationsData.slice(0, 3).map((pub) => ({
    heading: pub.heading,
    link: pub.link,
    issued_by: pub.issued_by,
    description: pub.description,
  })),

  sections: [
    {
      title: 'Projects',
      description:
        'Explore our innovative open-source projects spanning cybersecurity, AI, and more.',
      icon: 'code',
      link: '/projects',
      count: projectsData.repositories.length.toString() + '+',
    },
    {
      title: 'Publications',
      description:
        'Read our latest research papers and publications in top-tier conferences.',
      icon: 'book',
      link: '/publications',
      count: '15+',
    },
    {
      title: 'Community',
      description:
        'Join our vibrant community of developers, researchers, and innovators.',
      icon: 'users',
      link: '/community',
      count: '150+',
    },
  ],

  researchAreas: [
    {
      title: 'Cybersecurity',
      description:
        'Advanced security solutions, threat detection, and vulnerability analysis.',
      icon: 'shield',
      color: '#e74c3c',
    },
    {
      title: 'Artificial Intelligence',
      description:
        'Machine learning, deep learning, and intelligent systems development.',
      icon: 'brain',
      color: '#9b59b6',
    },
    {
      title: 'Digital Forensics',
      description:
        'Mobile forensics, data recovery, and evidence analysis tools.',
      icon: 'search',
      color: '#3498db',
    },
    {
      title: 'Privacy & Encryption',
      description:
        'Privacy-preserving technologies and cryptographic solutions.',
      icon: 'lock',
      color: '#2ecc71',
    },
    {
      title: 'Cloud Computing',
      description:
        'Distributed systems, cloud infrastructure, and scalable architecture.',
      icon: 'cloud',
      color: '#1abc9c',
    },
    {
      title: 'Internet Innovations',
      description:
        'Web technologies, networking protocols, and Internet of Things.',
      icon: 'globe',
      color: '#f39c12',
    },
  ],
};
