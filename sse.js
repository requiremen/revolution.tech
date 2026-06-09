// this route is damn important 
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
