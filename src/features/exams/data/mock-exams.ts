export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number // Index of the correct option
  explanation?: string
}

export interface Exam {
  id: string
  title: string
  description: string
  questionCount: number
  lastStudied?: string // ISO Date string
  questions: Question[]
}

export const mockExams: Exam[] = [
  {
    id: 'exam-1',
    title: 'AWS Certified Solutions Architect - Associate',
    description: 'Comprehensive practice for SAA-C03.',
    questionCount: 3,
    lastStudied: '2023-10-25T10:00:00Z',
    questions: [
      {
        id: 'q1',
        text: 'Which service provides object storage in AWS?',
        options: ['Amazon EC2', 'Amazon S3', 'Amazon RDS', 'Amazon EBS'],
        correctAnswer: 1,
        explanation: 'Amazon Simple Storage Service (Amazon S3) is an object storage service that offers industry-leading scalability, data availability, security, and performance.',
      },
      {
        id: 'q2',
        text: 'Which AWS service is used to run Docker containers?',
        options: ['Amazon Lambda', 'Amazon ECS', 'Amazon VPC', 'Amazon Route 53'],
        correctAnswer: 1,
        explanation: 'Amazon Elastic Container Service (Amazon ECS) is a fully managed container orchestration service that helps you easily deploy, manage, and scale containerized applications.',
      },
      {
        id: 'q3',
        text: 'What is the primary database service for relational databases?',
        options: ['Amazon DynamoDB', 'Amazon Redshift', 'Amazon RDS', 'Amazon ElastiCache'],
        correctAnswer: 2,
        explanation: 'Amazon Relational Database Service (Amazon RDS) makes it easy to set up, operate, and scale a relational database in the cloud.',
      },
    ],
  },
  {
    id: 'exam-2',
    title: 'Google Cloud Digital Leader',
    description: 'Foundational knowledge for Google Cloud.',
    questionCount: 2,
    questions: [
      {
        id: 'q1',
        text: 'What is Google Cloud’s serverless platform for developing and hosting web applications?',
        options: ['App Engine', 'Compute Engine', 'Kubernetes Engine', 'Cloud Functions'],
        correctAnswer: 0,
        explanation: 'App Engine is a fully managed, serverless platform for developing and hosting web applications at scale.',
      },
      {
        id: 'q2',
        text: 'Which service allows you to store and query petabytes of data?',
        options: ['Cloud SQL', 'BigQuery', 'Cloud Storage', 'Bigtable'],
        correctAnswer: 1,
        explanation: 'BigQuery is a serverless, highly scalable, and cost-effective multi-cloud data warehouse designed for business agility.',
      },
    ],
  },
]
