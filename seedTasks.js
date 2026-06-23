import { base44 } from './src/api/base44Client.js';

async function seedTasks() {
  const tasksToSeed = [
    { name: "Data Entry", description: "Complete data entry tasks", reward: 100, page_route: "/DataEntry" },
    { name: "Form Filling", description: "Complete form filling tasks", reward: 150, page_route: "/FormFilling" },
    { name: "PDF to Word Typing", description: "Type PDF documents into Word format", reward: 200, page_route: "/PdfToWordTyping" },
    { name: "Grammar Correction", description: "Correct grammar in provided text", reward: 120, page_route: "/GrammarCorrection" },
  ];

  for (const task of tasksToSeed) {
    try {
      await base44.entities.Task.create(task);
      console.log(`Created task: ${task.name}`);
    } catch (error) {
      console.error(`Failed to create task ${task.name}:`, error);
    }
  }
  
  console.log("Seeding complete. Exiting...");
  process.exit(0);
}

seedTasks();
