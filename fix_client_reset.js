const fs = require('fs');
const file = 'src/app/instructor-dashboard/courses/[courseId]/CourseEditClient.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('setNewLesson({ title: "", description: "", duration: "", videoUrl: "" })', 'setNewLesson({ title: "", description: "", duration: "", videoUrl: "", pdfUrl: "" })');

fs.writeFileSync(file, content);
