require('dotenv').config();
const mongoose = require('mongoose');
const { Resource } = require('../models/Resource');

function fallbackSemesterFromYear(year) {
  const y = Number(year);
  if (y === 1) return 1;
  if (y === 2) return 3;
  if (y === 3) return 5;
  return null;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  const shouldApply = process.argv.includes('--apply');

  await mongoose.connect(uri);

  const candidates = await Resource.find({
    $or: [{ semester: { $exists: false } }, { semester: null }],
  }).select('_id year semester title');

  let updatable = 0;
  const updates = [];
  for (const resource of candidates) {
    const semester = fallbackSemesterFromYear(resource.year);
    if (!semester) continue;
    updatable += 1;
    updates.push({
      updateOne: {
        filter: { _id: resource._id },
        update: { $set: { semester } },
      },
    });
  }

  if (!shouldApply) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          totalMissingSemester: candidates.length,
          updatable,
          skipped: candidates.length - updatable,
        },
        null,
        2
      )
    );
    await mongoose.disconnect();
    return;
  }

  if (updates.length > 0) {
    await Resource.bulkWrite(updates, { ordered: false });
  }

  console.log(
    JSON.stringify(
      {
        mode: 'apply',
        totalMissingSemester: candidates.length,
        updated: updates.length,
        skipped: candidates.length - updates.length,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
