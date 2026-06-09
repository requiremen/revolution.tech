import mongoose from "mongoose";

const generationSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    prompt: { type: String, required: true },
    output: {
        html: { type: String, default: "" },
        css: { type: String, default: "" },
        js: { type: String, default: "" }
    },
    version: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const Generation = mongoose.model("Generation", generationSchema);
export default Generation;
