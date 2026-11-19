const challenges = [
  {
    id: "sum-array",
    title: "Sum of an Array",
    difficulty: "Easy",
    skill: "JavaScript",
    timeMinutes: 15,
    description: "Write a function that returns the sum of all numbers in an array. Return 0 for an empty array.",
    functionName: "sumArray",
    starterCode: "function sumArray(numbers) {\n  // Write your solution here\n  \n}\n",
    examples: [
      { input: "[1, 2, 3, 4]", output: "10" },
      { input: "[-2, 5, 1]", output: "4" },
      { input: "[]", output: "0" }
    ],
    hints: ["Start with a running total of 0.", "Visit each number once and add it to the running total."],
    tests: [
      { input: [1, 2, 3, 4], expected: 10 },
      { input: [-2, 5, 1], expected: 4 },
      { input: [], expected: 0 },
      { input: [7], expected: 7 },
      { input: [0, -3, 3], expected: 0 }
    ]
  },
  {
    id: "reverse-string",
    title: "Reverse a String",
    difficulty: "Easy",
    skill: "JavaScript",
    timeMinutes: 15,
    description: "Write a function that returns the input string with its characters in reverse order.",
    functionName: "reverseString",
    starterCode: "function reverseString(text) {\n  // Write your solution here\n  \n}\n",
    examples: [
      { input: '"hello"', output: '"olleh"' },
      { input: '"PathPilot"', output: '"toliPhtaP"' }
    ],
    hints: ["A string can be traversed from its last index to its first.", "You can build a new string one character at a time."],
    tests: [
      { input: "hello", expected: "olleh" },
      { input: "PathPilot", expected: "toliPhtaP" },
      { input: "a", expected: "a" },
      { input: "", expected: "" },
      { input: "ab cd", expected: "dc ba" }
    ]
  },
  {
    id: "count-vowels",
    title: "Count Vowels",
    difficulty: "Easy",
    skill: "JavaScript",
    timeMinutes: 20,
    description: "Write a function that counts the vowels (a, e, i, o, u) in a string. Treat uppercase and lowercase vowels equally.",
    functionName: "countVowels",
    starterCode: "function countVowels(text) {\n  // Write your solution here\n  \n}\n",
    examples: [
      { input: '"PathPilot"', output: "3" },
      { input: '"SKY"', output: "0" }
    ],
    hints: ["Normalize the input to one letter case.", "Check each character against the set of five vowels."],
    tests: [
      { input: "PathPilot", expected: 3 },
      { input: "SKY", expected: 0 },
      { input: "AEIOU", expected: 5 },
      { input: "", expected: 0 },
      { input: "education", expected: 5 }
    ]
  }
];

exports.list = () => challenges.map(({ tests, starterCode, ...safe }) => safe);
exports.get = id => challenges.find(challenge => challenge.id === id);
