export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type BankQuestion = {
  id: string;
  category: string;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  marks: number;
};

type QuestionSeed = Omit<BankQuestion, 'id' | 'category' | 'topic' | 'difficulty' | 'correctAnswer' | 'marks'> & {
  topic: string;
  difficulty: Difficulty;
  answer: number;
};

const makeQuestion = (
  id: string,
  category: string,
  question: QuestionSeed,
): BankQuestion => ({
  id,
  category,
  topic: question.topic,
  difficulty: question.difficulty,
  prompt: question.prompt,
  options: question.options,
  correctAnswer: question.options[question.answer],
  explanation: question.explanation,
  marks: 1,
});

const seeds: Array<{ category: string; questions: QuestionSeed[] }> = [
  {
    category: 'Quantitative Aptitude',
    questions: [
      { topic: 'Percentages', difficulty: 'Beginner', prompt: 'A number is increased from 80 to 100. What is the percentage increase?', options: ['20%', '25%', '30%', '40%'], answer: 1, explanation: 'The increase is 20; 20 ÷ 80 × 100 = 25%.' },
      { topic: 'Profit and Loss', difficulty: 'Intermediate', prompt: 'An item costing ₹800 is sold at a profit of 15%. What is its selling price?', options: ['₹880', '₹900', '₹920', '₹940'], answer: 2, explanation: 'Selling price = 800 × 1.15 = ₹920.' },
      { topic: 'Ratios', difficulty: 'Beginner', prompt: 'The ratio of red to blue balls is 3:5. If there are 24 red balls, how many blue balls are there?', options: ['32', '36', '40', '45'], answer: 2, explanation: 'Each ratio unit is 24 ÷ 3 = 8, so blue balls = 5 × 8 = 40.' },
      { topic: 'Time and Work', difficulty: 'Intermediate', prompt: 'A can finish a job in 12 days and B in 18 days. Working together, how many days do they need?', options: ['6 days', '7.2 days', '8 days', '9 days'], answer: 1, explanation: 'Their combined daily rate is 1/12 + 1/18 = 5/36; time = 36/5 = 7.2 days.' },
      { topic: 'Simple Interest', difficulty: 'Beginner', prompt: 'What simple interest accrues on ₹5,000 at 8% per year for 2 years?', options: ['₹400', '₹800', '₹1,000', '₹1,200'], answer: 1, explanation: 'SI = principal × rate × time ÷ 100 = 5000 × 8 × 2 ÷ 100 = ₹800.' },
      { topic: 'Averages', difficulty: 'Beginner', prompt: 'The average of 12, 18, 20, and 30 is:', options: ['18', '19', '20', '21'], answer: 2, explanation: 'The sum is 80; 80 ÷ 4 = 20.' },
      { topic: 'Probability', difficulty: 'Intermediate', prompt: 'A fair six-sided die is rolled once. What is the probability of getting an even number?', options: ['1/6', '1/3', '1/2', '2/3'], answer: 2, explanation: 'The even outcomes are 2, 4, and 6: 3 favorable outcomes out of 6.' },
      { topic: 'Time, Speed and Distance', difficulty: 'Beginner', prompt: 'A car covers 150 km in 3 hours. What is its average speed?', options: ['40 km/h', '45 km/h', '50 km/h', '55 km/h'], answer: 2, explanation: 'Average speed = distance ÷ time = 150 ÷ 3 = 50 km/h.' },
      { topic: 'Algebra', difficulty: 'Intermediate', prompt: 'If 3x − 7 = 20, what is x?', options: ['7', '8', '9', '10'], answer: 2, explanation: 'Add 7 to get 3x = 27, then divide by 3.' },
      { topic: 'Number Systems', difficulty: 'Beginner', prompt: 'What is the least common multiple of 12 and 18?', options: ['24', '30', '36', '72'], answer: 2, explanation: 'The smallest number divisible by both 12 and 18 is 36.' },
      { topic: 'Compound Interest', difficulty: 'Advanced', prompt: 'What is the compound interest on ₹1,000 at 10% per year for 2 years, compounded annually?', options: ['₹200', '₹210', '₹220', '₹1,210'], answer: 1, explanation: 'The amount is 1000 × 1.1² = ₹1,210; interest is ₹210.' },
      { topic: 'Mensuration', difficulty: 'Intermediate', prompt: 'What is the area of a circle with radius 7 cm? Use π = 22/7.', options: ['44 cm²', '77 cm²', '154 cm²', '308 cm²'], answer: 2, explanation: 'Area = πr² = 22/7 × 7 × 7 = 154 cm².' },
      { topic: 'Permutations', difficulty: 'Advanced', prompt: 'How many distinct arrangements can be made using all the letters of the word CAT?', options: ['3', '6', '9', '12'], answer: 1, explanation: 'Three distinct letters can be arranged in 3! = 6 ways.' },
    ],
  },
  {
    category: 'Logical Reasoning',
    questions: [
      { topic: 'Number Series', difficulty: 'Beginner', prompt: 'What number comes next: 3, 7, 11, 15, ...?', options: ['17', '18', '19', '20'], answer: 2, explanation: 'Each term increases by 4, so the next term is 19.' },
      { topic: 'Number Series', difficulty: 'Intermediate', prompt: 'Find the next number: 2, 6, 12, 20, 30, ...', options: ['36', '40', '42', '44'], answer: 2, explanation: 'The terms are n(n+1): 1×2 through 5×6; next is 6×7 = 42.' },
      { topic: 'Syllogisms', difficulty: 'Intermediate', prompt: 'All tulips are flowers. No flower is a stone. Which conclusion follows?', options: ['Some stones are tulips', 'No tulip is a stone', 'All stones are flowers', 'Some flowers are stones'], answer: 1, explanation: 'Tulips are a subset of flowers, and flowers are disjoint from stones, so no tulip is a stone.' },
      { topic: 'Blood Relations', difficulty: 'Beginner', prompt: 'Mira says, “The woman in the photograph is my mother’s only daughter.” Who is the woman?', options: ['Mira', 'Mira’s aunt', 'Mira’s sister', 'Mira’s niece'], answer: 0, explanation: 'If Mira has no sister, her mother’s only daughter is Mira herself.' },
      { topic: 'Coding-Decoding', difficulty: 'Beginner', prompt: 'If each letter is shifted one place forward in the alphabet, how is CAT coded?', options: ['DBU', 'DBT', 'CBU', 'EBU'], answer: 0, explanation: 'C→D, A→B, and T→U.' },
      { topic: 'Directions', difficulty: 'Intermediate', prompt: 'Ravi walks 4 km north, then 3 km east. How far is he from his starting point?', options: ['5 km', '6 km', '7 km', '25 km'], answer: 0, explanation: 'The route forms a right triangle: √(4² + 3²) = 5 km.' },
      { topic: 'Analogies', difficulty: 'Beginner', prompt: 'Bird is to nest as bee is to:', options: ['Den', 'Hive', 'Burrow', 'Web'], answer: 1, explanation: 'A nest is a bird’s home; a hive is a bee’s home.' },
      { topic: 'Ranking', difficulty: 'Intermediate', prompt: 'Asha is 7th from the top and 18th from the bottom in a class. How many students are there?', options: ['24', '25', '26', '27'], answer: 0, explanation: 'Total = rank from top + rank from bottom − 1 = 7 + 18 − 1 = 24.' },
      { topic: 'Odd One Out', difficulty: 'Beginner', prompt: 'Which item does not belong with the others?', options: ['Triangle', 'Square', 'Circle', 'Cube'], answer: 3, explanation: 'Cube is three-dimensional; the other shapes are two-dimensional.' },
      { topic: 'Seating Arrangement', difficulty: 'Advanced', prompt: 'P, Q, and R sit in a row. Q is between P and R. Which person must be in the middle?', options: ['P', 'Q', 'R', 'Cannot be determined'], answer: 1, explanation: '“Q is between P and R” places Q in the middle of the three-person row.' },
      { topic: 'Clocks', difficulty: 'Advanced', prompt: 'What is the smaller angle between the clock hands at 3:00?', options: ['60°', '90°', '120°', '180°'], answer: 1, explanation: 'At 3:00 the minute hand is at 12 and hour hand at 3, a quarter turn apart.' },
      { topic: 'Calendar', difficulty: 'Intermediate', prompt: 'If today is Monday, what day will it be 10 days from today?', options: ['Wednesday', 'Thursday', 'Friday', 'Saturday'], answer: 1, explanation: 'Ten days is one week plus three days; Monday plus three days is Thursday.' },
      { topic: 'Logical Deduction', difficulty: 'Advanced', prompt: 'If the statement “If it rains, the match is cancelled” is true and the match was not cancelled, what follows?', options: ['It rained', 'It did not rain', 'The match was delayed', 'Nothing follows'], answer: 1, explanation: 'By modus tollens, not-cancelled implies the antecedent (rain) did not occur.' },
    ],
  },
  {
    category: 'Verbal Ability and English',
    questions: [
      { topic: 'Vocabulary', difficulty: 'Beginner', prompt: 'Choose the closest synonym of “meticulous.”', options: ['Careless', 'Precise', 'Impatient', 'Ordinary'], answer: 1, explanation: 'Meticulous means showing great attention to detail; precise is the closest choice.' },
      { topic: 'Vocabulary', difficulty: 'Intermediate', prompt: 'Choose the antonym of “scarce.”', options: ['Rare', 'Limited', 'Abundant', 'Insufficient'], answer: 2, explanation: 'Scarce means in short supply; abundant means plentiful.' },
      { topic: 'Grammar', difficulty: 'Beginner', prompt: 'Choose the grammatically correct sentence.', options: ['She do not enjoy music.', 'She does not enjoys music.', 'She does not enjoy music.', 'She not does enjoy music.'], answer: 2, explanation: 'The auxiliary “does” takes the base form “enjoy.”' },
      { topic: 'Subject-Verb Agreement', difficulty: 'Intermediate', prompt: 'Neither the coach nor the players ___ ready.', options: ['is', 'was', 'are', 'has'], answer: 2, explanation: 'With “neither...nor,” the verb agrees with the nearer subject, “players.”' },
      { topic: 'Articles', difficulty: 'Beginner', prompt: 'Select the correct article: She is ___ honest officer.', options: ['a', 'an', 'the', 'no article'], answer: 1, explanation: '“Honest” begins with a vowel sound, so it takes “an.”' },
      { topic: 'Prepositions', difficulty: 'Intermediate', prompt: 'The committee is responsible ___ reviewing the proposal.', options: ['to', 'for', 'with', 'at'], answer: 1, explanation: 'The standard collocation is “responsible for.”' },
      { topic: 'Sentence Improvement', difficulty: 'Intermediate', prompt: 'Choose the best correction: “He has went to the library.”', options: ['He have gone to the library.', 'He has gone to the library.', 'He had went to the library.', 'He is go to the library.'], answer: 1, explanation: 'The present perfect uses “has” plus the past participle “gone.”' },
      { topic: 'Active and Passive Voice', difficulty: 'Advanced', prompt: 'Choose the passive form of “The team completed the project.”', options: ['The project completed the team.', 'The project was completed by the team.', 'The team was completed by the project.', 'The project is completing the team.'], answer: 1, explanation: 'The object becomes the subject; past simple passive is “was completed.”' },
      { topic: 'Reported Speech', difficulty: 'Advanced', prompt: 'Change to reported speech: He said, “I am tired.”', options: ['He said that I am tired.', 'He said that he was tired.', 'He says that he is tired.', 'He told that he tired.'], answer: 1, explanation: 'In reported speech after “said,” the pronoun changes to he and present “am” backshifts to “was.”' },
      { topic: 'Reading Comprehension', difficulty: 'Intermediate', prompt: 'A passage says a city added bus lanes and commute times fell. Which inference is best supported?', options: ['Every resident now uses a bus.', 'Bus lanes contributed to shorter commutes.', 'The city removed all cars.', 'Commutes will never increase again.'], answer: 1, explanation: 'The stated change supports a contribution from bus lanes, not absolute claims about every resident or the future.' },
      { topic: 'Sentence Ordering', difficulty: 'Intermediate', prompt: 'Which sentence is the best opening for a paragraph about planting trees?', options: ['This is why they matter.', 'First, choose a suitable native species.', 'Trees can improve shade and local air quality.', 'Finally, water the sapling.'], answer: 2, explanation: 'It introduces the topic; the other choices rely on prior context or describe later steps.' },
      { topic: 'Vocabulary', difficulty: 'Advanced', prompt: 'What does “pragmatic” most nearly mean?', options: ['Guided by practical considerations', 'Based on wishful thinking', 'Concerned only with theory', 'Unwilling to compromise'], answer: 0, explanation: 'Pragmatic describes an approach focused on practical consequences and workable solutions.' },
      { topic: 'Punctuation', difficulty: 'Beginner', prompt: 'Which sentence uses the apostrophe correctly?', options: ['The students books are here.', 'The student’s books are here.', 'The students’ book’s are here.', 'The students book’s are here.'], answer: 1, explanation: 'A singular student owns the books, so the possessive form is “student’s.”' },
    ],
  },
  {
    category: 'Data Structures and Algorithms',
    questions: [
      { topic: 'Stacks and Queues', difficulty: 'Beginner', prompt: 'Which data structure follows last-in, first-out order?', options: ['Queue', 'Stack', 'Heap', 'Graph'], answer: 1, explanation: 'A stack removes the most recently inserted item first (LIFO).' },
      { topic: 'Searching', difficulty: 'Beginner', prompt: 'What is the worst-case time complexity of binary search on a sorted array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 1, explanation: 'Each comparison halves the remaining search interval, giving logarithmic time.' },
      { topic: 'Sorting', difficulty: 'Intermediate', prompt: 'What is the average time complexity of merge sort?', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'], answer: 2, explanation: 'Merge sort makes O(log n) levels of merges, each processing O(n) elements.' },
      { topic: 'Linked Lists', difficulty: 'Intermediate', prompt: 'What is the time complexity of inserting a node at the head of a singly linked list?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 0, explanation: 'Only the new node and head pointers need to be updated.' },
      { topic: 'Trees', difficulty: 'Intermediate', prompt: 'In a binary search tree with distinct keys, where is the minimum key found?', options: ['At the root', 'At the rightmost node', 'At the leftmost node', 'At any leaf'], answer: 2, explanation: 'Following left-child links reaches the smallest key in a BST.' },
      { topic: 'Graphs', difficulty: 'Intermediate', prompt: 'Which traversal typically uses a queue to explore a graph level by level?', options: ['Depth-first search', 'Breadth-first search', 'In-order traversal', 'Topological sort only'], answer: 1, explanation: 'BFS uses a queue to visit vertices in increasing distance from the start.' },
      { topic: 'Hash Tables', difficulty: 'Intermediate', prompt: 'What is the expected lookup time in a well-sized hash table?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 0, explanation: 'With a good hash function and controlled load factor, average lookup is constant time.' },
      { topic: 'Recursion', difficulty: 'Beginner', prompt: 'What is essential to prevent a recursive function from recursing indefinitely?', options: ['A global variable', 'A base case', 'A queue', 'A hash function'], answer: 1, explanation: 'A base case terminates recursion for sufficiently small inputs.' },
      { topic: 'Heaps', difficulty: 'Intermediate', prompt: 'In a min-heap, which element is at the root?', options: ['The maximum element', 'The minimum element', 'The median element', 'Any leaf element'], answer: 1, explanation: 'The min-heap property keeps the smallest key at the root.' },
      { topic: 'Dynamic Programming', difficulty: 'Advanced', prompt: 'Dynamic programming is especially useful when a problem has which properties?', options: ['Only sorted input', 'Overlapping subproblems and optimal substructure', 'No repeated computation', 'A constant-size input'], answer: 1, explanation: 'DP stores subproblem results when subproblems overlap and optimal solutions compose.' },
      { topic: 'Complexity Analysis', difficulty: 'Advanced', prompt: 'What is the auxiliary space complexity of iterative binary search?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 0, explanation: 'The iterative algorithm keeps only a fixed number of indices and variables.' },
      { topic: 'Graphs', difficulty: 'Advanced', prompt: 'Which algorithm finds shortest paths from one source when all edge weights are non-negative?', options: ['Kruskal’s algorithm', 'Dijkstra’s algorithm', 'Binary search', 'Prim’s algorithm'], answer: 1, explanation: 'Dijkstra’s algorithm repeatedly settles the nearest unvisited vertex and requires non-negative weights.' },
      { topic: 'Sorting', difficulty: 'Advanced', prompt: 'Which sorting algorithm is stable by its standard implementation?', options: ['Heap sort', 'Selection sort', 'Merge sort', 'Quick sort'], answer: 2, explanation: 'Merge sort can preserve the original order of equal keys while merging.' },
    ],
  },
  {
    category: 'Programming and Coding',
    questions: [
      { topic: 'Variables and Types', difficulty: 'Beginner', prompt: 'In a statically typed language, when are variable types generally checked?', options: ['Only after deployment', 'During compilation or static analysis', 'Only when a user logs in', 'Never'], answer: 1, explanation: 'Static type checking detects type errors before program execution.' },
      { topic: 'Loops', difficulty: 'Beginner', prompt: 'How many times does this loop run: for (i = 0; i < 5; i++)?', options: ['4', '5', '6', 'Depends on i after the loop'], answer: 1, explanation: 'The values 0, 1, 2, 3, and 4 satisfy i < 5: five iterations.' },
      { topic: 'Functions', difficulty: 'Beginner', prompt: 'What does a function’s return statement usually do?', options: ['Repeats the function', 'Sends a value back to its caller and exits the function', 'Declares a new class', 'Starts a new process'], answer: 1, explanation: 'A return statement ends the current function call and provides its result.' },
      { topic: 'Debugging', difficulty: 'Intermediate', prompt: 'A variable unexpectedly has a null value. What is the most direct first debugging step?', options: ['Delete the project', 'Inspect where the variable is assigned and trace its value', 'Increase the screen resolution', 'Rewrite every function'], answer: 1, explanation: 'Tracing assignments and control flow identifies where the unexpected value originates.' },
      { topic: 'Object-Oriented Programming', difficulty: 'Intermediate', prompt: 'What is encapsulation in object-oriented programming?', options: ['Combining data and methods behind a controlled interface', 'Running multiple programs at once', 'Sorting objects by size', 'Converting source code to machine code'], answer: 0, explanation: 'Encapsulation bundles state and behavior and controls how callers access the state.' },
      { topic: 'Algorithms', difficulty: 'Intermediate', prompt: 'What is the result of evaluating 17 % 5 in languages where % is remainder?', options: ['2', '3', '3.4', '5'], answer: 0, explanation: '17 divided by 5 leaves a remainder of 2.' },
      { topic: 'Testing', difficulty: 'Intermediate', prompt: 'What is the primary purpose of a unit test?', options: ['Test one small unit of behavior in isolation', 'Measure internet speed', 'Replace every integration test', 'Install production dependencies'], answer: 0, explanation: 'Unit tests check a focused component or function, typically with controlled dependencies.' },
      { topic: 'Error Handling', difficulty: 'Intermediate', prompt: 'Why should an application handle expected exceptions explicitly?', options: ['To hide every failure', 'To recover or report a meaningful failure safely', 'To guarantee code has no bugs', 'To make loops faster'], answer: 1, explanation: 'Explicit handling enables controlled recovery and clear error reporting instead of crashes or silent failure.' },
      { topic: 'Programming Logic', difficulty: 'Beginner', prompt: 'What is the value of Boolean expression (true AND false)?', options: ['true', 'false', 'null', 'undefined'], answer: 1, explanation: 'AND is true only when both operands are true.' },
      { topic: 'Recursion', difficulty: 'Advanced', prompt: 'What problem can deep recursion cause when each call uses stack space?', options: ['Stack overflow', 'A guaranteed deadlock', 'Loss of network connectivity', 'A syntax error at compile time'], answer: 0, explanation: 'Excessive nested calls can exhaust the call stack and cause a stack overflow.' },
      { topic: 'Data Handling', difficulty: 'Intermediate', prompt: 'Why validate user input on the server even if the browser validates it?', options: ['Browser checks can be bypassed', 'Server validation slows attacks', 'Browsers cannot send strings', 'It is required to render HTML'], answer: 0, explanation: 'Clients are untrusted; requests can be crafted without the browser interface.' },
      { topic: 'Version Control', difficulty: 'Beginner', prompt: 'What does a Git commit represent?', options: ['A saved snapshot of tracked project changes', 'A running web server', 'A package installation', 'A database query'], answer: 0, explanation: 'A commit records a project snapshot and its metadata in repository history.' },
      { topic: 'Concurrency', difficulty: 'Advanced', prompt: 'What is a race condition?', options: ['A loop that runs quickly', 'A result that depends on unpredictable timing of concurrent operations', 'A failed database backup', 'A syntax-highlighted code block'], answer: 1, explanation: 'Concurrent access without suitable coordination can make outcomes depend on operation timing.' },
    ],
  },
  {
    category: 'Computer Science Fundamentals',
    questions: [
      { topic: 'DBMS', difficulty: 'Beginner', prompt: 'What is the purpose of a primary key in a relational table?', options: ['Uniquely identify each row', 'Store multiple tables in one cell', 'Encrypt every column', 'Sort rows automatically'], answer: 0, explanation: 'A primary key uniquely identifies a row and cannot be null.' },
      { topic: 'DBMS', difficulty: 'Intermediate', prompt: 'Which ACID property ensures a transaction is all-or-nothing?', options: ['Consistency', 'Isolation', 'Atomicity', 'Durability'], answer: 2, explanation: 'Atomicity means the transaction fully succeeds or has no effect.' },
      { topic: 'DBMS', difficulty: 'Advanced', prompt: 'What is the main purpose of database normalization?', options: ['Increase data duplication', 'Reduce redundancy and update anomalies', 'Remove all indexes', 'Encrypt network traffic'], answer: 1, explanation: 'Normalization structures relations to reduce redundancy and avoid modification anomalies.' },
      { topic: 'Operating Systems', difficulty: 'Beginner', prompt: 'Which component schedules processes for CPU execution?', options: ['Compiler', 'Operating system scheduler', 'File extension', 'Cache line'], answer: 1, explanation: 'The OS scheduler selects which ready process or thread runs next.' },
      { topic: 'Operating Systems', difficulty: 'Intermediate', prompt: 'Which condition is necessary for deadlock?', options: ['Circular wait', 'Unlimited memory', 'A single process only', 'A read-only file'], answer: 0, explanation: 'Circular wait is one of the four Coffman conditions required for deadlock.' },
      { topic: 'Operating Systems', difficulty: 'Intermediate', prompt: 'What is virtual memory?', options: ['A technique that gives processes an address space backed by physical memory and storage', 'A faster CPU register', 'A type of source code', 'A network routing protocol'], answer: 0, explanation: 'Virtual memory maps process address spaces onto physical memory and may use disk backing.' },
      { topic: 'Computer Networks', difficulty: 'Beginner', prompt: 'Which protocol translates a domain name into an IP address?', options: ['HTTP', 'DNS', 'FTP', 'SMTP'], answer: 1, explanation: 'DNS resolves domain names to records such as IP addresses.' },
      { topic: 'Computer Networks', difficulty: 'Intermediate', prompt: 'Which transport protocol provides reliable, ordered delivery?', options: ['UDP', 'TCP', 'IP', 'ARP'], answer: 1, explanation: 'TCP provides sequence tracking, acknowledgements, retransmission, and ordered delivery.' },
      { topic: 'Computer Networks', difficulty: 'Intermediate', prompt: 'Which OSI layer is primarily responsible for routing packets between networks?', options: ['Physical', 'Data Link', 'Network', 'Presentation'], answer: 2, explanation: 'The network layer handles logical addressing and routing between networks.' },
      { topic: 'OOP', difficulty: 'Beginner', prompt: 'Which OOP concept allows a subclass to reuse behavior from a parent class?', options: ['Inheritance', 'Normalization', 'Serialization', 'Routing'], answer: 0, explanation: 'Inheritance allows a derived class to extend or reuse a base class.' },
      { topic: 'OOP', difficulty: 'Intermediate', prompt: 'What is polymorphism?', options: ['One interface supporting different implementations', 'Storing a table without keys', 'Splitting a packet into frames', 'A process waiting for I/O'], answer: 0, explanation: 'Polymorphism lets the same operation or interface work with different implementations.' },
      { topic: 'OOP', difficulty: 'Intermediate', prompt: 'What is method overriding?', options: ['A subclass providing its own implementation of an inherited method', 'Calling a method with too many parameters', 'Deleting a class at runtime', 'Changing a database index'], answer: 0, explanation: 'Overriding replaces inherited behavior with a subtype-specific implementation.' },
      { topic: 'DBMS', difficulty: 'Advanced', prompt: 'What does a foreign key enforce?', options: ['Referential integrity between related tables', 'A fixed order for every query', 'Unique values across the entire database', 'Automatic encryption of a table'], answer: 0, explanation: 'A foreign key constrains references to valid rows in a related table.' },
    ],
  },
  {
    category: 'General Knowledge and Current Affairs',
    questions: [
      { topic: 'Indian Polity', difficulty: 'Beginner', prompt: 'Which body conducts elections to the Parliament of India?', options: ['Election Commission of India', 'Finance Commission', 'NITI Aayog', 'Union Public Service Commission'], answer: 0, explanation: 'The Election Commission of India administers elections to Parliament and state legislatures.' },
      { topic: 'Indian Polity', difficulty: 'Intermediate', prompt: 'Which part of the Indian Constitution contains the Directive Principles of State Policy?', options: ['Part II', 'Part III', 'Part IV', 'Part V'], answer: 2, explanation: 'Directive Principles of State Policy are set out in Part IV.' },
      { topic: 'Geography', difficulty: 'Beginner', prompt: 'Which is the largest ocean on Earth?', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], answer: 3, explanation: 'The Pacific Ocean is the largest ocean by area.' },
      { topic: 'Geography', difficulty: 'Intermediate', prompt: 'The Tropic of Cancer passes through which country?', options: ['India', 'Australia', 'South Africa', 'Argentina'], answer: 0, explanation: 'The Tropic of Cancer crosses central India.' },
      { topic: 'Science', difficulty: 'Beginner', prompt: 'Which gas makes up the largest share of Earth’s atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], answer: 1, explanation: 'Nitrogen makes up about 78% of the atmosphere.' },
      { topic: 'Science', difficulty: 'Intermediate', prompt: 'What is the SI unit of electric current?', options: ['Volt', 'Ohm', 'Ampere', 'Watt'], answer: 2, explanation: 'The ampere is the SI base unit for electric current.' },
      { topic: 'Economy', difficulty: 'Intermediate', prompt: 'Which institution is India’s central bank?', options: ['State Bank of India', 'Reserve Bank of India', 'SEBI', 'NABARD'], answer: 1, explanation: 'The Reserve Bank of India is the country’s central bank.' },
      { topic: 'History', difficulty: 'Beginner', prompt: 'In which year did India become independent?', options: ['1942', '1945', '1947', '1950'], answer: 2, explanation: 'India became independent on 15 August 1947.' },
      { topic: 'International Organizations', difficulty: 'Beginner', prompt: 'Where is the headquarters of the United Nations?', options: ['Geneva', 'New York City', 'Paris', 'The Hague'], answer: 1, explanation: 'The UN headquarters is in New York City.' },
      { topic: 'Environment', difficulty: 'Intermediate', prompt: 'Which international agreement focuses on limiting global warming through national climate commitments?', options: ['Paris Agreement', 'Montreal Protocol', 'Geneva Convention', 'Ramsar Convention'], answer: 0, explanation: 'The Paris Agreement establishes a framework for climate action and national emissions commitments.' },
      { topic: 'Space and Technology', difficulty: 'Beginner', prompt: 'Which Indian organization is responsible for the national space programme?', options: ['DRDO', 'ISRO', 'CSIR', 'BARC'], answer: 1, explanation: 'ISRO (Indian Space Research Organisation) leads India’s space programme.' },
      { topic: 'Civics', difficulty: 'Intermediate', prompt: 'What is the minimum age to vote in Indian general elections?', options: ['16 years', '18 years', '21 years', '25 years'], answer: 1, explanation: 'Eligible Indian citizens may vote from age 18.' },
      { topic: 'Current Affairs Literacy', difficulty: 'Advanced', prompt: 'When comparing two reports about a recent policy announcement, which practice best supports reliable understanding?', options: ['Rely on the headline alone', 'Check the announcement date and verify details against an official primary source', 'Assume older figures are current', 'Share the first post encountered'], answer: 1, explanation: 'Checking dates and primary sources helps distinguish verified, current details from outdated or misleading summaries.' },
      { topic: 'Current Affairs and Economy', difficulty: 'Intermediate', prompt: 'Which organization publishes the World Economic Outlook, a regular assessment of global economic prospects?', options: ['World Trade Organization', 'International Monetary Fund', 'World Health Organization', 'International Labour Organization'], answer: 1, explanation: 'The International Monetary Fund publishes the World Economic Outlook and its analysis of global growth and economic risks.' },
    ],
  },
  {
    category: 'Placement Preparation',
    questions: [
      { topic: 'Interview Preparation', difficulty: 'Beginner', prompt: 'Which response is most effective when asked to describe a project in an interview?', options: ['List tools without context', 'Explain the problem, your contribution, decisions, and measurable outcome', 'Discuss only the team’s work', 'Avoid mentioning challenges'], answer: 1, explanation: 'A concise problem-action-result explanation makes your individual contribution and impact clear.' },
      { topic: 'Resume Skills', difficulty: 'Beginner', prompt: 'Which resume bullet is strongest?', options: ['Worked on backend', 'Helped sometimes', 'Implemented a caching layer that reduced median API latency by 30%', 'Used many technologies'], answer: 2, explanation: 'Specific action and measurable impact make the accomplishment concrete and verifiable.' },
      { topic: 'Behavioral Interviews', difficulty: 'Intermediate', prompt: 'In the STAR response method, what does “A” stand for?', options: ['Analysis', 'Action', 'Aim', 'Audience'], answer: 1, explanation: 'STAR stands for Situation, Task, Action, Result.' },
      { topic: 'Technical Interviews', difficulty: 'Intermediate', prompt: 'When a coding problem is unclear, what is the best first step?', options: ['Start coding immediately', 'Ask clarifying questions and confirm assumptions', 'Choose a random data structure', 'Skip edge cases'], answer: 1, explanation: 'Clarifying inputs, constraints, and expected behavior avoids solving the wrong problem.' },
      { topic: 'Complexity Analysis', difficulty: 'Intermediate', prompt: 'An algorithm checks every pair among n items using nested loops. What is its likely time complexity?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 3, explanation: 'There are approximately n × n pair checks, giving quadratic time.' },
      { topic: 'SQL Interviews', difficulty: 'Beginner', prompt: 'Which SQL clause filters rows before grouping?', options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'], answer: 1, explanation: 'WHERE filters input rows; HAVING filters groups after aggregation.' },
      { topic: 'Object-Oriented Design', difficulty: 'Intermediate', prompt: 'Which principle recommends that a class have one reason to change?', options: ['Single Responsibility Principle', 'Open-Closed Principle', 'Liskov Substitution Principle', 'Dependency Inversion Principle'], answer: 0, explanation: 'The Single Responsibility Principle groups a class around one responsibility.' },
      { topic: 'Operating Systems Interviews', difficulty: 'Intermediate', prompt: 'What is a context switch?', options: ['Switching the CPU from one process or thread to another', 'Converting a file to PDF', 'Changing a database schema', 'Resolving a host name'], answer: 0, explanation: 'The OS saves one execution context and restores another so a different task can run.' },
      { topic: 'Networking Interviews', difficulty: 'Intermediate', prompt: 'What does HTTP status code 404 indicate?', options: ['Request succeeded', 'Resource was not found', 'Authentication succeeded', 'Server is permanently unavailable'], answer: 1, explanation: 'HTTP 404 indicates that the requested resource was not found.' },
      { topic: 'Problem Solving', difficulty: 'Advanced', prompt: 'You have a correct but slow solution. What should you communicate before optimizing it?', options: ['Nothing; silently rewrite it', 'Its correctness, complexity, and the bottleneck you plan to improve', 'Only the programming language', 'That optimization is impossible'], answer: 1, explanation: 'Explaining a working baseline and its complexity makes the optimization reasoning transparent.' },
      { topic: 'Placement Aptitude', difficulty: 'Beginner', prompt: 'A candidate answers 36 of 40 questions correctly. What is the accuracy?', options: ['80%', '85%', '90%', '95%'], answer: 2, explanation: 'Accuracy = 36 ÷ 40 × 100 = 90%.' },
      { topic: 'Workplace Communication', difficulty: 'Intermediate', prompt: 'You discover a project deadline is at risk. What is the best professional response?', options: ['Wait until the deadline passes', 'Promptly explain the risk, impact, and a recovery plan to stakeholders', 'Hide the blocker', 'Blame a teammate publicly'], answer: 1, explanation: 'Early, factual communication paired with a recovery plan enables timely decisions.' },
      { topic: 'Technical Interviews', difficulty: 'Advanced', prompt: 'A concurrent counter occasionally loses increments. Which change most directly addresses the race?', options: ['Use a synchronization primitive or an atomic increment', 'Increase the counter’s display width', 'Add a longer sleep', 'Rename the variable'], answer: 0, explanation: 'Atomic operations or appropriate locking make the read-modify-write increment indivisible.' },
    ],
  },
];

export const questionBank: BankQuestion[] = seeds.flatMap(({ category, questions }) =>
  questions.map((question, index) => makeQuestion(
    `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(index + 1).padStart(2, '0')}`,
    category,
    question,
  )),
);

export const questionCategories = seeds.map(({ category }) => category);
