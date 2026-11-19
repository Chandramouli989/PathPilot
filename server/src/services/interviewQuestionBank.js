const roles = {
  "Frontend Developer": [
    { id: "fe-1", category: "Technical", difficulty: "Foundation", prompt: "Explain the difference between var, let and const in JavaScript. When would you use each?", focus: ["scope", "hoisting", "reassignment", "examples"] },
    { id: "fe-2", category: "Technical", difficulty: "Foundation", prompt: "What is the difference between == and === in JavaScript? Give an example where it matters.", focus: ["type coercion", "strict equality", "example"] },
    { id: "fe-3", category: "Technical", difficulty: "Intermediate", prompt: "Explain how React state updates work. Why should you avoid mutating state directly?", focus: ["state update", "immutability", "rerender", "example"] },
    { id: "fe-4", category: "Technical", difficulty: "Intermediate", prompt: "What is the difference between useEffect and useMemo? Give a practical use case for each.", focus: ["side effects", "memoization", "dependencies", "use case"] },
    { id: "fe-5", category: "Technical", difficulty: "Intermediate", prompt: "How would you improve the performance of a React page that renders a large list?", focus: ["profiling", "list virtualization", "memoization", "pagination"] },
    { id: "fe-6", category: "Project", difficulty: "Intermediate", prompt: "Walk me through a React project you built. Explain its component structure, state management, API integration and one difficult bug you solved.", focus: ["project context", "architecture", "state", "API", "challenge", "result"] }
  ],
  "Full Stack Developer": [
    { id: "fs-1", category: "Technical", difficulty: "Foundation", prompt: "Explain what happens from the moment a user submits a login form until the server responds with an authenticated result.", focus: ["request", "route", "validation", "database", "password hash", "JWT", "response"] },
    { id: "fs-2", category: "Technical", difficulty: "Intermediate", prompt: "What is middleware in Express.js? Explain how authentication middleware protects a route.", focus: ["request-response cycle", "next", "token verification", "authorization"] },
    { id: "fs-3", category: "Technical", difficulty: "Intermediate", prompt: "How would you design CRUD APIs for a user's personal task list while ensuring users cannot access each other's tasks?", focus: ["REST", "authentication", "ownership filter", "validation", "status codes"] },
    { id: "fs-4", category: "Technical", difficulty: "Intermediate", prompt: "When would you choose SQL over MongoDB, and what trade-offs would you consider?", focus: ["data shape", "relationships", "transactions", "schema", "trade-offs"] },
    { id: "fs-5", category: "Technical", difficulty: "Intermediate", prompt: "How do you handle API errors in a React application and communicate useful feedback to users?", focus: ["try catch", "HTTP status", "loading state", "error state", "user feedback"] },
    { id: "fs-6", category: "Project", difficulty: "Intermediate", prompt: "Describe the architecture of a full-stack project you built. How does the frontend communicate with the backend, and how is user data protected?", focus: ["architecture", "API", "authentication", "database", "ownership", "trade-offs"] }
  ],
  "Backend Developer": [
    { id: "be-1", category: "Technical", difficulty: "Foundation", prompt: "Explain the request-response lifecycle in an Express application.", focus: ["HTTP", "middleware", "route", "controller", "response"] },
    { id: "be-2", category: "Technical", difficulty: "Intermediate", prompt: "How would you design authentication using password hashing and JWT? What should never be stored in a JWT payload?", focus: ["hashing", "bcrypt", "signing", "expiry", "claims", "secrets"] },
    { id: "be-3", category: "Technical", difficulty: "Intermediate", prompt: "What is the difference between authentication and authorization? Give an API example.", focus: ["identity", "permissions", "ownership", "example"] },
    { id: "be-4", category: "Technical", difficulty: "Intermediate", prompt: "How do database indexes help performance, and what is the cost of adding too many indexes?", focus: ["lookup", "read performance", "write overhead", "storage", "selectivity"] },
    { id: "be-5", category: "Technical", difficulty: "Intermediate", prompt: "How would you validate incoming API data and return consistent errors to clients?", focus: ["validation", "sanitization", "status codes", "error format"] },
    { id: "be-6", category: "Project", difficulty: "Intermediate", prompt: "Describe a backend feature you implemented. Explain the model, route, controller, validation and how you tested it.", focus: ["data model", "route", "controller", "validation", "testing", "ownership"] }
  ],
  "Software Engineer": [
    { id: "se-1", category: "Technical", difficulty: "Foundation", prompt: "Explain the four pillars of object-oriented programming with a practical example.", focus: ["encapsulation", "abstraction", "inheritance", "polymorphism", "example"] },
    { id: "se-2", category: "Technical", difficulty: "Foundation", prompt: "What is the difference between an array and a linked list? Compare their common operation costs.", focus: ["memory", "random access", "insertion", "deletion", "complexity"] },
    { id: "se-3", category: "Technical", difficulty: "Intermediate", prompt: "How would you approach solving a problem when the straightforward solution is too slow?", focus: ["constraints", "brute force", "bottleneck", "data structure", "complexity"] },
    { id: "se-4", category: "Technical", difficulty: "Intermediate", prompt: "Explain time complexity and space complexity. Analyze a simple nested-loop example.", focus: ["input size", "growth", "time", "space", "Big O"] },
    { id: "se-5", category: "Technical", difficulty: "Intermediate", prompt: "What is the purpose of unit testing, and how would you test a function with edge cases?", focus: ["isolation", "expected behavior", "boundary cases", "invalid input", "regression"] },
    { id: "se-6", category: "Project", difficulty: "Intermediate", prompt: "Choose one project and explain the problem, your design decisions, the hardest technical issue and what you would improve next.", focus: ["problem", "design", "challenge", "decision", "learning", "improvement"] }
  ]
};

const behavioral = [
  { id: "hr-1", category: "Behavioral", difficulty: "Foundation", prompt: "Tell me about yourself and explain why you are interested in this role.", focus: ["present background", "relevant skills", "evidence", "role motivation", "concise close"] },
  { id: "hr-2", category: "Behavioral", difficulty: "Intermediate", prompt: "Describe a challenging situation in a project and explain how you handled it.", focus: ["situation", "task", "action", "result", "learning"] },
  { id: "hr-3", category: "Behavioral", difficulty: "Intermediate", prompt: "Tell me about a time you received feedback or made a mistake. What did you change afterward?", focus: ["context", "ownership", "response", "specific change", "learning"] },
  { id: "hr-4", category: "Behavioral", difficulty: "Foundation", prompt: "How do you prioritize tasks when you have multiple deadlines?", focus: ["prioritization", "impact", "planning", "communication", "example"] },
  { id: "hr-5", category: "Behavioral", difficulty: "Foundation", prompt: "Why should we hire you for this entry-level position?", focus: ["role fit", "demonstrated skills", "learning mindset", "evidence", "value"] }
];

function list(role = "Full Stack Developer", category = "All") {
  const roleQuestions = roles[role] || roles["Full Stack Developer"];
  const all = [...roleQuestions, ...behavioral];
  return all.filter(q => category === "All" || q.category === category)
    .map(({ focus, ...publicQuestion }) => publicQuestion);
}

function get(role, questionId) {
  const roleQuestions = roles[role] || roles["Full Stack Developer"];
  return [...roleQuestions, ...behavioral].find(q => q.id === questionId) || null;
}

module.exports = { list, get, roles: Object.keys(roles) };
