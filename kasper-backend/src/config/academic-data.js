const ACADEMIC_STRUCTURE = {
    'Computers & AI': [
        'Computer Science',
        'Information Systems',
        'Information Technology',
        'Artificial Intelligence',
        'Decision Support',
    ],
    Engineering: [
        'Computer Engineering',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Architecture',
    ],
    Science: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geology'],
    Commerce: ['Accounting', 'Business Administration', 'Economics', 'Finance'],
};

const COLLEGES = Object.keys(ACADEMIC_STRUCTURE);

// Object.hasOwn مهم: من غيره college = "constructor" أو "__proto__"
// بيرجع حاجة من الـ prototype، و.includes هتضرب TypeError (يعني 500 بدل 400)
const is_valid_pair = (college, department) =>
    Object.hasOwn(ACADEMIC_STRUCTURE, college) &&
    ACADEMIC_STRUCTURE[college].includes(department);

module.exports = { ACADEMIC_STRUCTURE, COLLEGES, is_valid_pair };