// Seed data for the SkillBridge prototype. All demo data lives here;
// the store merges it with anything users create at runtime.

export const DEGREES = [
  'BSc in Computer Science',
  'BCA',
  'BSc in Data Science',
  'B.Tech Computer Science',
  'B.Tech Electronics & Communication',
  'B.Tech Mechanical',
  'B.Tech Information Technology',
  'B.Com',
  'BBA',
  'Diploma in Engineering',
  'Other',
]

export const EDU_LEVELS = ['School (SSLC/10th)', 'Pre-University (PUC/12th)', 'Diploma', 'Bachelor’s Degree']

export const INTEREST_AREAS = [
  'Software Development',
  'Data Science & Analytics',
  'Cloud & DevOps',
  'Embedded Systems',
  'Machine Learning & AI',
  'Cybersecurity',
  'Design & UX',
  'Finance & Risk',
]

export const ALL_SKILLS = [
  'Python', 'Java', 'SQL', 'React', 'JavaScript', 'C', 'C++', 'AWS', 'Linux',
  'Machine Learning', 'Statistics', 'Power BI', 'Excel', 'Spring Boot',
  'Embedded C', 'RTOS', 'Communication', 'Problem Solving',
]

const now = Date.now()
const daysAgo = (d) => new Date(now - d * 86400000).toISOString()

// ---------- companies (industry portal accounts) ----------
export const seedCompanies = [
  {
    userId: 'u-technova',
    name: 'TechNova Solutions',
    email: 'careers@technova.in',
    phone: '+91 80 4712 2200',
    address: 'Tower B, Manyata Tech Park, Bengaluru, Karnataka',
    cin: 'U72900KA2015PTC091234',
    verified: true,
    description:
      'Product engineering company building cloud-native SaaS for logistics and supply chains. We hire full-stack, cloud and data talent who ship fast and love Python, Java and AWS.',
    tags: ['Software Development', 'Cloud & DevOps', 'Data Science & Analytics'],
  },
  {
    userId: 'u-blueorbit',
    name: 'BlueOrbit Systems',
    email: 'talent@blueorbit.co.in',
    phone: '+91 40 6633 8800',
    address: 'Plot 19, Hardware Park, Hyderabad, Telangana',
    cin: 'U74999TS2011PTC077410',
    verified: true,
    description:
      'Defence and aerospace electronics major. We look for embedded, firmware and test engineers strong in C, RTOS and microcontrollers.',
    tags: ['Embedded Systems'],
  },
  {
    userId: 'u-finedge',
    name: 'FinEdge Analytics',
    email: 'people@finedge.in',
    phone: '+91 22 6120 4400',
    address: 'One BKC, Bandra Kurla Complex, Mumbai, Maharashtra',
    cin: 'U65990MH2018PTC312655',
    verified: true,
    description:
      'Fintech analytics firm serving banks and NBFCs. We hire analysts and ML engineers fluent in SQL, statistics, Python and risk modelling.',
    tags: ['Data Science & Analytics', 'Machine Learning & AI', 'Finance & Risk'],
  },
]

// ---------- institute ----------
export const seedInstitutes = [
  {
    userId: 'u-sunfield',
    name: 'Sunfield Institute of Technology',
    email: 'registrar@sunfield.edu.in',
    phone: '+91 80 2545 0900',
    address: 'Survey 88, Hosur Road, Bengaluru, Karnataka 560100',
    collegeCode: 'SIT-204',
    accreditation: { naac: 'A+', nba: ['CSE', 'ECE', 'Mechanical'] },
    aisheId: 'I-20102',
    verified: true,
  },
  {
    userId: 'u-apex',
    name: 'Apex Institute of Engineering',
    email: 'placements@apexeng.edu.in',
    phone: '+91 40 2300 1122',
    address: 'Gachibowli Main Rd, Hyderabad, Telangana 500032',
    collegeCode: 'AIE-501',
    accreditation: { naac: 'A', nba: ['CSE', 'Data Science'] },
    aisheId: 'I-34910',
    verified: true,
  },
  {
    userId: 'u-horizon',
    name: 'Horizon College of Technology',
    email: 'info@horizontech.edu.in',
    phone: '+91 22 2890 5544',
    address: 'Powai Lake Road, Mumbai, Maharashtra 400076',
    collegeCode: 'HCT-108',
    accreditation: { naac: 'B++', nba: ['ECE'] },
    aisheId: 'I-19402',
    verified: true,
  },
]
export const seedInstitute = seedInstitutes[0]

export const DEPARTMENTS = ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Data Science']

// ---------- faculty ----------
export const seedFaculty = [
  {
    userId: 'u-meera',
    name: 'Dr. Meera Krishnan',
    email: 'meera.k@sunfield.edu.in',
    phone: '+91 98450 22110',
    department: 'Computer Science',
    institute: 'Sunfield Institute of Technology',
    experience: '12 years — Algorithms, Distributed Systems',
    papers: [
      { title: 'Adaptive Load Balancing in Edge Clusters', detail: 'IEEE ICDCS 2024 · https://doi.org/10.1109/ICDCS.2024.11' },
      { title: 'Low-cost Labs for Systems Education', detail: 'SIGCSE 2023 · https://doi.org/10.1145/sigcse.2023.44' },
    ],
  },
  {
    userId: 'u-arjun',
    name: 'Prof. Arjun Nair',
    email: 'arjun.n@sunfield.edu.in',
    phone: '+91 98860 77441',
    department: 'Electronics & Communication',
    institute: 'Sunfield Institute of Technology',
    experience: '9 years — VLSI and Embedded Systems',
    papers: [{ title: 'Power Gating Strategies for IoT ASICs', detail: 'IEEE VLSID 2022' }],
  },
  {
    userId: 'u-rajesh',
    name: 'Dr. Rajesh Verma',
    email: 'rajesh.v@apexeng.edu.in',
    phone: '+91 98765 11223',
    department: 'Computer Science',
    institute: 'Apex Institute of Engineering',
    experience: '14 years — Data Science, Cloud Architectures',
    papers: [{ title: 'Distributed Graph Processing on Big Data Platforms', detail: 'IEEE TPDS 2023' }],
  },
  {
    userId: 'u-swati',
    name: 'Prof. Swati Kulkarni',
    email: 'swati.k@horizontech.edu.in',
    phone: '+91 98200 44556',
    department: 'Data Science',
    institute: 'Horizon College of Technology',
    experience: '8 years — Machine Learning, Predictive Analytics',
    papers: [{ title: 'Deep Learning for Medical Image Classification', detail: 'NeurIPS Workshop 2023' }],
  },
]

// ---------- students (institution roster + one live demo account) ----------
const S = (
  id, name, dept, year, skills, overall, interests, opts = {},
) => ({
  userId: id,
  name,
  email: `${id.replace('u-', '')}@${(opts.institute || 'Sunfield Institute of Technology').toLowerCase().includes('apex') ? 'apexeng.edu.in' : (opts.institute || '').toLowerCase().includes('horizon') ? 'horizontech.edu.in' : 'sunfield.edu.in'}`,
  phone: `+91 9${String(700000000 + Math.floor(Math.random() * 299999999)).slice(0, 9)}`,
  age: 19 + (year - 1),
  department: dept,
  degree: dept === 'Data Science' ? 'BSc in Data Science' : dept === 'Computer Science' ? 'B.Tech Computer Science' : dept === 'Mechanical' ? 'B.Tech Mechanical' : 'B.Tech Electronics & Communication',
  institute: opts.institute || 'Sunfield Institute of Technology',
  year,
  skills,
  interests,
  assessment: overall == null ? null : { overall, takenAt: daysAgo(40) },
  jobInterest: opts.jobInterest ?? interests[0],
  placed: opts.placed ?? null,
  internshipDone: opts.internshipDone ?? false,
  coursesDone: opts.coursesDone ?? 0,
  live: opts.live ?? false,
})

export const seedStudents = [
  S('u-priya', 'Priya Sharma', 'Computer Science', 3, ['Python', 'SQL', 'Java', 'Problem Solving'], 78,
    ['Software Development', 'Data Science & Analytics'], { institute: 'Sunfield Institute of Technology', jobInterest: 'Software Engineer', live: true, internshipDone: true, coursesDone: 1 }),
  S('u-rahul', 'Rahul Verma', 'Computer Science', 4, ['Java', 'Spring Boot', 'SQL', 'React'], 84,
    ['Software Development'], { institute: 'Sunfield Institute of Technology', jobInterest: 'Software Engineer', placed: { company: 'TechNova Solutions', packageLPA: 9.5 } }),
  S('u-ananya', 'Ananya Iyer', 'Computer Science', 3, ['Python', 'Machine Learning', 'Statistics'], 81,
    ['Machine Learning & AI', 'Data Science & Analytics'], { institute: 'Sunfield Institute of Technology', jobInterest: 'ML Engineer', internshipDone: true, coursesDone: 2 }),
  S('u-vikram', 'Vikram Singh', 'Computer Science', 2, ['JavaScript', 'React'], 55,
    ['Software Development', 'Design & UX'], { institute: 'Sunfield Institute of Technology', jobInterest: 'Frontend Developer' }),
  S('u-sneha', 'Sneha Patil', 'Electronics & Communication', 4, ['C', 'Embedded C', 'RTOS'], 76,
    ['Embedded Systems'], { institute: 'Sunfield Institute of Technology', jobInterest: 'Embedded Engineer', placed: { company: 'BlueOrbit Systems', packageLPA: 7.2 } }),
  S('u-karthik', 'Karthik Rao', 'Electronics & Communication', 3, ['C', 'C++', 'Python'], 63,
    ['Embedded Systems', 'Cybersecurity'], { institute: 'Sunfield Institute of Technology', jobInterest: 'Firmware Engineer', internshipDone: true }),
  
  // Apex Institute of Engineering students
  S('u-divya', 'Divya Menon', 'Electronics & Communication', 2, ['C', 'Communication'], 48,
    ['Embedded Systems'], { institute: 'Apex Institute of Engineering', jobInterest: 'Test Engineer' }),
  S('u-aakash', 'Aakash Gupta', 'Mechanical', 4, ['Excel', 'Problem Solving'], 52,
    ['Finance & Risk'], { institute: 'Apex Institute of Engineering', jobInterest: 'Operations Analyst', placed: { company: 'FinEdge Analytics', packageLPA: 6.1 } }),
  S('u-ishita', 'Ishita Bose', 'Data Science', 3, ['Python', 'SQL', 'Statistics', 'Power BI'], 88,
    ['Data Science & Analytics', 'Machine Learning & AI'], { institute: 'Apex Institute of Engineering', jobInterest: 'Data Analyst', internshipDone: true, coursesDone: 2 }),
  
  // Horizon College of Technology students
  S('u-rohan', 'Rohan Kulkarni', 'Data Science', 3, ['Python', 'SQL'], 61,
    ['Data Science & Analytics'], { institute: 'Horizon College of Technology', jobInterest: 'Data Analyst' }),
  S('u-fatima', 'Fatima Khan', 'Data Science', 4, ['Python', 'Machine Learning', 'SQL', 'AWS'], 90,
    ['Machine Learning & AI', 'Cloud & DevOps'], { institute: 'Horizon College of Technology', jobInterest: 'ML Engineer', placed: { company: 'FinEdge Analytics', packageLPA: 12.4 }, internshipDone: true }),
  S('u-aditya', 'Aditya Joshi', 'Computer Science', 4, ['AWS', 'Linux', 'Python', 'JavaScript'], 73,
    ['Cloud & DevOps'], { institute: 'Horizon College of Technology', jobInterest: 'Cloud Associate', internshipDone: true, coursesDone: 1 }),
]

// ---------- postings ----------
export const seedJobs = [
  {
    id: 'j-swe', companyId: 'u-technova', title: 'Software Engineer', post: 'Software Engineer',
    location: 'Bengaluru', skills: ['Java', 'Spring Boot', 'SQL', 'React'], minScore: 60,
    salary: '9 – 12 LPA', experience: '0–2 yrs', openings: 6, postedAt: daysAgo(9),
    description: 'Build and operate microservices and React front-ends for our logistics SaaS. Work in agile squads with senior mentors.',
  },
  {
    id: 'j-da', companyId: 'u-technova', title: 'Data Analyst', post: 'Data Analyst',
    location: 'Bengaluru', skills: ['Python', 'SQL', 'Power BI'], minScore: 55,
    salary: '7 – 9 LPA', experience: '0–2 yrs', openings: 3, postedAt: daysAgo(6),
    description: 'Own dashboards and insight pipelines for customer operations. SQL-first culture, Python for automation.',
  },
  {
    id: 'j-cloud', companyId: 'u-technova', title: 'Cloud Associate Engineer', post: 'Cloud Engineer',
    location: 'Bengaluru', skills: ['AWS', 'Linux', 'Python'], minScore: 55,
    salary: '8 – 10 LPA', experience: '0–3 yrs', openings: 4, postedAt: daysAgo(13),
    description: 'Deploy, monitor and automate our multi-region AWS estate alongside the platform team.',
  },
  {
    id: 'j-emb', companyId: 'u-blueorbit', title: 'Embedded Systems Engineer', post: 'Embedded Engineer',
    location: 'Hyderabad', skills: ['C', 'Embedded C', 'RTOS'], minScore: 60,
    salary: '7 – 9 LPA', experience: '0–2 yrs', openings: 5, postedAt: daysAgo(11),
    description: 'Firmware for flight-control boards. Bare-metal C, RTOS drivers and rigorous test discipline.',
  },
  {
    id: 'j-test', companyId: 'u-blueorbit', title: 'Systems Test Engineer', post: 'Test Engineer',
    location: 'Hyderabad', skills: ['Python', 'C'], minScore: 50,
    salary: '6 – 8 LPA', experience: '0–2 yrs', openings: 3, postedAt: daysAgo(16),
    description: 'Automated HIL test rigs for avionics hardware. Python automation plus comfort with C codebases.',
  },
  {
    id: 'j-risk', companyId: 'u-finedge', title: 'Risk Analyst', post: 'Risk Analyst',
    location: 'Mumbai', skills: ['SQL', 'Excel', 'Statistics'], minScore: 55,
    salary: '8 – 11 LPA', experience: '0–2 yrs', openings: 4, postedAt: daysAgo(4),
    description: 'Credit-risk modelling for bank clients. Strong SQL, statistics and storytelling with data.',
  },
  {
    id: 'j-mle', companyId: 'u-finedge', title: 'Machine Learning Engineer', post: 'ML Engineer',
    location: 'Mumbai', skills: ['Python', 'Machine Learning', 'SQL'], minScore: 70,
    salary: '14 – 18 LPA', experience: '0–3 yrs', openings: 2, postedAt: daysAgo(2),
    description: 'Productionise fraud and default-prediction models. Feature stores, drift monitoring, clean MLOps.',
  },
]

export const seedInternships = [
  {
    id: 'i-fsd', companyId: 'u-technova', title: 'Full-Stack Development Intern',
    location: 'Bengaluru', skills: ['JavaScript', 'React', 'SQL'], duration: '6 months', stipend: '₹25,000/mo',
    minScore: 55, openings: 8, postedAt: daysAgo(5),
    description: 'Ship real features on our logistics web app with a dedicated mentor and weekly code reviews.',
  },
  {
    id: 'i-de', companyId: 'u-technova', title: 'Data Engineering Intern',
    location: 'Bengaluru', skills: ['Python', 'SQL'], duration: '4 months', stipend: '₹20,000/mo',
    minScore: 55, openings: 4, postedAt: daysAgo(8),
    description: 'Build ingestion pipelines and dbt models feeding customer dashboards.',
  },
  {
    id: 'i-emb', companyId: 'u-blueorbit', title: 'Embedded Systems Intern',
    location: 'Hyderabad', skills: ['C', 'Embedded C'], duration: '6 months', stipend: '₹18,000/mo',
    minScore: 55, openings: 6, postedAt: daysAgo(10),
    description: 'Driver bring-up and unit testing on STM32 boards with the firmware team.',
  },
  {
    id: 'i-an', companyId: 'u-finedge', title: 'Analytics Intern',
    location: 'Mumbai', skills: ['SQL', 'Excel', 'Statistics'], duration: '3 months', stipend: '₹22,000/mo',
    minScore: 50, openings: 5, postedAt: daysAgo(7),
    description: 'Support risk analysts with data pulls, validation and portfolio reports.',
  },
  {
    id: 'i-ml', companyId: 'u-finedge', title: 'Machine Learning Intern',
    location: 'Mumbai', skills: ['Python', 'Machine Learning'], duration: '6 months', stipend: '₹30,000/mo',
    minScore: 65, openings: 3, postedAt: daysAgo(3),
    description: 'Experiment tracking and model evaluation for fraud-detection systems.',
  },
]

// ---------- courses ----------
export const seedCourses = [
  { id: 'c-py', title: 'Python for Data Science', skill: 'Python', provider: 'SkillBridge Academy', duration: '6 weeks', level: 'Beginner', interests: ['Data Science & Analytics', 'Machine Learning & AI', 'Software Development'] },
  { id: 'c-sql', title: 'SQL & Database Design', skill: 'SQL', provider: 'SkillBridge Academy', duration: '4 weeks', level: 'Beginner', interests: ['Data Science & Analytics', 'Software Development', 'Finance & Risk'] },
  { id: 'c-react', title: 'React & Modern Frontend', skill: 'React', provider: 'SkillBridge Academy', duration: '8 weeks', level: 'Intermediate', interests: ['Software Development', 'Design & UX'] },
  { id: 'c-java', title: 'Java + Spring Boot Foundations', skill: 'Spring Boot', provider: 'SkillBridge Academy', duration: '8 weeks', level: 'Intermediate', interests: ['Software Development'] },
  { id: 'c-aws', title: 'AWS Cloud Practitioner Prep', skill: 'AWS', provider: 'SkillBridge Academy', duration: '5 weeks', level: 'Beginner', interests: ['Cloud & DevOps'] },
  { id: 'c-ml', title: 'Machine Learning Foundations', skill: 'Machine Learning', provider: 'SkillBridge Academy', duration: '10 weeks', level: 'Advanced', interests: ['Machine Learning & AI', 'Data Science & Analytics'] },
  { id: 'c-emb', title: 'Embedded C & Microcontrollers', skill: 'Embedded C', provider: 'SkillBridge Academy', duration: '7 weeks', level: 'Intermediate', interests: ['Embedded Systems'] },
  { id: 'c-stats', title: 'Statistics for Analytics', skill: 'Statistics', provider: 'SkillBridge Academy', duration: '5 weeks', level: 'Beginner', interests: ['Data Science & Analytics', 'Finance & Risk'] },
]

// ---------- faculty development programs ----------
export const seedFdps = [
  { id: 'f-ai', title: 'AI in Engineering Education', org: 'AICTE Training & Learning Academy', mode: 'Online', duration: '2 weeks', starts: '15 Sep 2026', seats: 200, tags: ['Machine Learning & AI'] },
  { id: 'f-cloud', title: 'Cloud Computing with Hands-on Labs', org: 'SWAYAM / NPTEL', mode: 'Hybrid', duration: '4 weeks', starts: '6 Oct 2026', seats: 150, tags: ['Cloud & DevOps'] },
  { id: 'f-dt', title: 'Design Thinking for Educators', org: 'Ministry of Education Innovation Cell', mode: 'Online', duration: '1 week', starts: '22 Sep 2026', seats: 300, tags: ['Design & UX'] },
  { id: 'f-cy', title: 'Cybersecurity Bootcamp for Faculty', org: 'NASSCOM FutureSkills Prime', mode: 'Online', duration: '3 weeks', starts: '1 Nov 2026', seats: 120, tags: ['Cybersecurity'] },
]

export const seedAnnouncements = [
  {
    id: 'a-1', facultyId: 'u-meera', institute: 'Sunfield Institute of Technology', title: 'Campus drive: TechNova Solutions — 12 Sep',
    body: 'TechNova will conduct a campus drive for Software Engineer and Data Analyst roles on 12 Sep, 10:00 AM, Seminar Hall A. Students with ≥60% aggregate and completed skill assessments are eligible. Carry your updated resume.',
    audience: 'All students', createdAt: daysAgo(2),
  },
  {
    id: 'a-2', facultyId: 'u-arjun', institute: 'Sunfield Institute of Technology', title: 'Skill assessment week — complete yours!',
    body: 'The placement cell is running skill assessment week till Friday. Your assessment score unlocks internship matches and appears on your profile. Students of ECE and CSE, please prioritise this.',
    audience: 'All students', createdAt: daysAgo(5),
  },
  {
    id: 'a-3', facultyId: 'u-rajesh', institute: 'Apex Institute of Engineering', title: 'FinEdge Risk Analytics placement orientation — 18 Sep',
    body: 'Orientation session for FinEdge Analytics recruitment drive at Apex Auditorium. All final year CS & Mech students welcome.',
    audience: 'All students', createdAt: daysAgo(3),
  },
  {
    id: 'a-4', facultyId: 'u-swati', institute: 'Horizon College of Technology', title: 'Data Science & ML Internship workshop — 20 Sep',
    body: 'Hands-on preparation workshop for upcoming ML and Data Engineering internship interviews. Registration link active.',
    audience: 'All students', createdAt: daysAgo(1),
  },
]

// ---------- assessment question bank ----------
export const QUESTION_BANK = {
  Python: [
    { q: 'What does list(map(str, [1, 2, 3])) return?', opts: ["['1','2','3']", '[1,2,3]', "'123'", 'Error'], a: 0 },
    { q: 'Which keyword defines a generator function?', opts: ['yield', 'gen', 'async', 'lambda'], a: 0 },
    { q: 'What is the output of bool("")?', opts: ['False', 'True', 'None', 'TypeError'], a: 0 },
    { q: 'Which structure is immutable?', opts: ['tuple', 'list', 'dict', 'set'], a: 0 },
  ],
  Java: [
    { q: 'Which keyword prevents a class from being subclassed?', opts: ['final', 'static', 'sealed-off', 'const'], a: 0 },
    { q: 'Default value of an int field in a class?', opts: ['0', 'null', 'undefined', 'Compile error'], a: 0 },
    { q: 'Which collection preserves insertion order and allows fast random access?', opts: ['ArrayList', 'HashSet', 'LinkedList', 'PriorityQueue'], a: 0 },
  ],
  SQL: [
    { q: 'Which clause filters rows AFTER aggregation?', opts: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'], a: 0 },
    { q: 'What does a LEFT JOIN return?', opts: ['All left rows + matching right rows', 'Only matching rows', 'All right rows', 'Cartesian product'], a: 0 },
    { q: 'Which command removes a table and its schema?', opts: ['DROP TABLE', 'DELETE TABLE', 'REMOVE TABLE', 'TRUNCATE SCHEMA'], a: 0 },
  ],
  React: [
    { q: 'Which hook adds local state to a function component?', opts: ['useState', 'useEffect', 'useRef', 'useMemo'], a: 0 },
    { q: 'What is the purpose of the key prop in lists?', opts: ['Stable identity for reconciliation', 'CSS styling', 'Event binding', 'Sorting'], a: 0 },
    { q: 'When does useEffect with [] run?', opts: ['Once after first render', 'Every render', 'Never', 'Before render'], a: 0 },
  ],
  C: [
    { q: 'What does &x denote in C?', opts: ['Address of x', 'Value of x', 'Reference alias', 'Pointer size'], a: 0 },
    { q: 'sizeof(char) in C is guaranteed to be?', opts: ['1', '2', '4', 'Platform-dependent'], a: 0 },
    { q: 'Which header declares malloc?', opts: ['stdlib.h', 'stdio.h', 'malloc.h', 'alloc.h'], a: 0 },
  ],
  'Embedded C': [
    { q: 'volatile keyword tells the compiler to…', opts: ['Re-read the variable every access', 'Store in ROM', 'Inline the variable', 'Make it thread-local'], a: 0 },
    { q: 'An ISR should generally…', opts: ['Be short and avoid blocking', 'Use printf heavily', 'Malloc freely', 'Run in user mode'], a: 0 },
  ],
  RTOS: [
    { q: 'Priority inversion is mitigated using…', opts: ['Priority inheritance', 'Larger stacks', 'Faster CPU', 'Round-robin only'], a: 0 },
    { q: 'A mutex differs from a binary semaphore mainly in…', opts: ['Ownership semantics', 'Speed always', 'Memory only', 'ISR usage'], a: 0 },
  ],
  JavaScript: [
    { q: 'typeof null returns…', opts: ["'object'", "'null'", "'undefined'", "'none'"], a: 0 },
    { q: 'Which creates a new scope for block variables?', opts: ['let', 'var', 'function only', 'window'], a: 0 },
  ],
  AWS: [
    { q: 'Which service provides virtual servers?', opts: ['EC2', 'S3', 'RDS', 'Lambda'], a: 0 },
    { q: 'S3 stores data as…', opts: ['Objects in buckets', 'Tables', 'Blocks', 'Files in NFS'], a: 0 },
  ],
  Linux: [
    { q: 'Which command shows running processes?', opts: ['ps', 'ls', 'df', 'cat'], a: 0 },
    { q: 'chmod 755 gives others…', opts: ['read + execute', 'full access', 'write only', 'no access'], a: 0 },
  ],
  'Machine Learning': [
    { q: 'Overfitting means the model…', opts: ['Memorises training data, generalises poorly', 'Under-trains', 'Has high bias', 'Uses too little data always'], a: 0 },
    { q: 'Which metric suits imbalanced classification best?', opts: ['F1 / PR-AUC', 'Accuracy', 'MSE', 'R²'], a: 0 },
  ],
  Statistics: [
    { q: 'The p-value measures…', opts: ['Evidence against the null hypothesis', 'Probability H0 is true', 'Effect size', 'Sample bias'], a: 0 },
    { q: 'Median is robust to…', opts: ['Outliers', 'Sample size', 'Units', 'Scaling only'], a: 0 },
  ],
  'Power BI': [
    { q: 'DAX is used in Power BI to…', opts: ['Write calculated measures/columns', 'Style visuals', 'Import images', 'Publish to web'], a: 0 },
    { q: 'Relationships in the model view connect…', opts: ['Tables', 'Pages', 'Workspaces', 'Gateways'], a: 0 },
  ],
  Excel: [
    { q: 'Which function joins tables by key?', opts: ['XLOOKUP/VLOOKUP', 'SUMIF', 'TRIM', 'MID'], a: 0 },
    { q: 'A PivotTable is used to…', opts: ['Aggregate and slice data', 'Merge cells', 'Protect sheets', 'Draw charts only'], a: 0 },
  ],
  'Spring Boot': [
    { q: '@RestController combines…', opts: ['@Controller + @ResponseBody', '@Service + @Bean', '@Autowired + @Config', 'None'], a: 0 },
    { q: 'Default embedded server in Spring Boot is…', opts: ['Tomcat', 'Jetty', 'Undertow', 'Nginx'], a: 0 },
  ],
  'Problem Solving': [
    { q: 'Big-O of binary search on a sorted array?', opts: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], a: 0 },
    { q: 'Best data structure for FIFO behaviour?', opts: ['Queue', 'Stack', 'Heap', 'Trie'], a: 0 },
  ],
  'Communication': [
    { q: 'A good status update leads with…', opts: ['The conclusion/ask', 'Full history', 'Jargon', 'Apologies'], a: 0 },
    { q: 'STAR stands for…', opts: ['Situation, Task, Action, Result', 'None of these', 'Scope, Time, Aim, Review', 'Story, Tone, Aim, Result'], a: 0 },
  ],
}

// Shuffle options deterministically-ish at seed time so answers aren't always first.
export function shuffledQuestion(skill, qIdx) {
  const base = QUESTION_BANK[skill]?.[qIdx]
  if (!base) return null
  const seedN = (skill.length * 7 + qIdx * 13) % base.opts.length
  const order = base.opts.map((_, i) => (i + seedN) % base.opts.length)
  const opts = order.map((i) => base.opts[i])
  return { q: base.q, opts, a: order.indexOf(base.a) }
}
