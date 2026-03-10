import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractUniqueLastnames = async () => {
  const lastnameFrequency = new Map();

  const inputFile = path.join(__dirname, '../data/lastnames.csv');
  const outputFile = path.join(__dirname, '../unique_lastnames.json');

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip header
    }

    // Parse CSV line - LASTNAME is column 2, VALUE is column 5
    const match = line.match(/"[^"]*","([^"]*)","[^"]*","[^"]*","(\d+)"/);
    if (match && match[1] && match[2]) {
      const lastname = match[1];
      const count = parseInt(match[2]);

      // Aggregate counts across all cantons
      if (lastnameFrequency.has(lastname)) {
        lastnameFrequency.set(
          lastname,
          lastnameFrequency.get(lastname) + count,
        );
      } else {
        lastnameFrequency.set(lastname, count);
      }
    }
  }

  // Convert Map to array of objects with lastname and frequency
  const lastnamesWithFrequency = Array.from(lastnameFrequency.entries())
    .map(([lastname, frequency]) => ({ lastname, frequency }))
    .sort((a, b) => b.frequency - a.frequency); // Sort by frequency descending

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(lastnamesWithFrequency, null, 2));

  console.log(
    `Extracted ${lastnamesWithFrequency.length} unique lastnames with frequencies`,
  );
  console.log(
    `Most common: ${lastnamesWithFrequency[0].lastname} (${lastnamesWithFrequency[0].frequency})`,
  );
  console.log(
    `Least common: ${lastnamesWithFrequency[lastnamesWithFrequency.length - 1].lastname} (${lastnamesWithFrequency[lastnamesWithFrequency.length - 1].frequency})`,
  );
  console.log(`Saved to ${outputFile}`);
};

extractUniqueLastnames().catch(console.error);

// Made with Bob
