import mongoose from "mongoose";
// Transactions require Atlas or a local replica set; reject standalone MongoDB early.
export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const info = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!info.setName && info.msg !== "isdbgrid") {
    await mongoose.disconnect();
    throw new Error(
      "Use MongoDB Atlas or a replica set. Standalone MongoDB cannot safely run checkout transactions.",
    );
  }
}
