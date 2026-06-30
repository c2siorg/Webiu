import { publicationsData } from '../../page/publications/publications-data';

export interface HomepageFeaturedData {
  projectCount: number;
  featured: {
    name: string;
    description: string;
    language: string;
    topics: string[];
    stars: number;
    link: string;
  }[];
}

const DEFAULT_FEATURED: HomepageFeaturedData = {
  projectCount: 10,
  featured: [
    {
      name: 'Scan8',
      description:
        'Scan8 is a Kubernetes-based rapid URL/File scan system that allows to submit a list of URLs/files and take out the scan results.',
      language: 'Python',
      topics: ['gsoc', 'python', 'security'],
      stars: 18,
      link: 'https://github.com/c2siorg/Scan8',
    },
    {
      name: 'Webiu',
      description:
        'A modern web platform for managing and showcasing open-source projects, contributors, and publications.',
      language: 'TypeScript',
      topics: ['angular', 'nestjs', 'web-platform'],
      stars: 8,
      link: 'https://github.com/c2siorg/Webiu',
    },
    {
      name: 'OpenMF',
      description: 'An Open Source Mobile Forensics Investigation Tool for Android Platform',
      language: 'JavaScript',
      topics: ['forensics', 'mobile', 'android'],
      stars: 2,
      link: 'https://github.com/c2siorg/OpenMF',
    },
  ],
};

export const getHomepageDetails = (featuredData?: HomepageFeaturedData) => {
  const data = featuredData ?? DEFAULT_FEATURED;

  return {
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
        value: data.projectCount.toString(),
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

    featuredProjects: data.featured.map((project) => ({
      name: project.name,
      description: project.description,
      language: project.language,
      topics: project.topics.slice(0, 3),
      stars: project.stars,
      link: project.link,
    })),

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
        count: `${data.projectCount}+`,
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
};
