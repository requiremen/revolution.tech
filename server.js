import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import helmet from "helmet";
import cors from "cors";
import connectDb from "./database.js";
import User from "./models/users.js";
import Project from "./models/projects.js";
import authmiddleware from "./authmiddleware.js";
import { generateContentStream } from "./models/gemeni.service.js";
import Generation from "./models/generation.js";
connectDb();
const app = express();
const port = 3000;
app.use(cors());
app.use(helmet());
app.use(express.json());


app.post("/register", async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const existinguser = await User.findOne({ username: username })
    if (existinguser) {
        return res.status(400).json({
            msg: "users already exist pls login"
        })

    }
    const saltrounds = 10
    const hashedpassword = await bcrypt.hash(password, saltrounds)
    await User.create({
        username: username,
        password: hashedpassword
    });
    return res.status(200).json({
        msg: "you are registed succefully"
    });
});
app.post("/signin", async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const finduser = await User.findOne({ username: username })


    if (!finduser) {
        return res.status(400).json({
            msg: "user doesn't exist"

        })
    }
    const compaarepassword = await bcrypt.compare(password, finduser.password)

    if (!compaarepassword) {
        return res.status(400).json({
            msg: "invalid password"
        })

    }
    const token = jwt.sign({ username: finduser.username, user_Id: finduser._id }, "secretkey")
    return res.status(200).json({
        msg: "you are signed in successfully",
        token: token
    })
})
app.get("/projects", authmiddleware, async (req, res) => {
    const projects = await Project.find({ userId: req.userId })
    return res.status(200).json({
        projects: projects
    })


})
app.post("/projects", authmiddleware, async (req, res) => {
    const project = await Project.create({
        userId: req.userId,
        name: req.body.name,
        description: req.body.description
    });
    return res.status(200).json({
        project: project,
        msg: "project is created successfully"
    })
})
app.put("/projects/:id", authmiddleware, async (req, res) => {
    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { name: req.body.name, description: req.body.description, updatedAt: Date.now() },
        { new: true }
    );
    if (!project) {
        return res.status(404).json({
            msg: "project not found or you dont have access"
        })
    }
    return res.status(200).json({
        msg: "project updated successfully",
        project: project
    })

})
app.delete("/projects/:id", authmiddleware, async (req, res) => {
    const project = await Project.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId

    })
    if (!project) return res.status(404).json({
        msg: "project not found"
    })
    return res.status(200).json({
        msg: "project deleted successfully",
        project: project
    })

})
app.post("/projects/:id/generate", authmiddleware, async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id, userId: req.userId
    })
    if (!project) {
        return res.status(404).json({
            msg: "project not found"
        })
    }
    res.setHeader("Content-type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("connection", "keep-alive");
    const prompt = req.body.prompt;
    let fulltext = "";
    try {
        const stream = await generateContentStream(prompt);
        for await (const chunk of stream) {
            const text = chunk.text || "";
            fulltext += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);

        }
        let output;
        try {
            output = JSON.parse(fulltext)
        } catch {
            output = { html: fulltext, css: "", js: "" }
        }
        const lastgeneration = await Generation.findOne({
            projectId: project._id
        }).sort({ version: -1 });
        const version = lastgeneration ? lastgeneration.version + 1 : 1;
        const generation = await Generation.create({
            projectId: project._id,
            prompt: prompt,
            output,
            version
        })
        res.write(`event:done\ndata:${JSON.stringify({
            generationId: generation._id,
            version
        })}\n\n`)
        res.end();
    } catch (err) {
        console.log("Generate error:", err);
        res.write(`event: error\ndata: ${JSON.stringify({ msg: err.message })}\n\n`)
        res.end();
    }
})

app.get("/preview/:projectId", async (req, res) => {
    const generation = await Generation.findOne({
        projectId: req.params.projectId
    }).sort({ version: -1 });

    if (!generation) {
        return res.status(404).send("<h1>No preview available</h1>");
    }

    const { html, css, js } = generation.output;
    const page = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>${js}</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(page);
})

app.listen(port, () => {
    console.log(`App is listening on ${port}`);
})
