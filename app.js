const express = require("express");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const emailConfig = {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
};

const app = express();
app.use(cors());
app.use(express.json());

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).send("An error occured");
});

const createMongoClient = () => new MongoClient(uri);

const router = express.Router();

router.get("/", (req, res) => {
  res.json("Hello to my app");
});

router.get("/newsletter", async (req, res) => {
  try {
    const client = createMongoClient();
    await client.connect();
    const database = client.db("portfolio");
    const newsletterCollection = database.collection("newsletterEmails");
    const pipeline = [];

    const allNewsletterEmails = await newsletterCollection
      .aggregate(pipeline)
      .toArray();

    res.json(allNewsletterEmails);
  } catch (err) {
    next(err);
  }
});

router.post("/newsletter", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const client = createMongoClient();
    await client.connect();
    const database = client.db("portfolio");
    const newsletterCollection = database.collection("newsletterEmails");

    const existingEmail = await newsletterCollection.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const result = await newsletterCollection.insertOne({ email });

    res.status(201).json({
      message: "Email added successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    next(err);
  }
});


//Projects routes
router.get("/projects", async (req, res) => {
  try {
    const client = createMongoClient();
    await client.connect();
    const database = client.db("portfolio");
    const projectsCollection = database.collection("projects");

    const pipeline = [];

    const allProjects = await projectsCollection.aggregate(pipeline).toArray();

    res.json(allProjects);
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const client = createMongoClient();
    await client.connect();
    const database = client.db("portfolio");
    const projectsCollection = database.collection("projects");

    const project = await projectsCollection.findOne({
      id: projectId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    next(err);
  }
});

//Email route
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass,
  },
});

router.post("/send-email", (req, res) => {
  const { from, name, phone, subject, text } = req.body;

  const mailOptions = {
    from: from,
    to: process.env.EMAIL_USER,
    subject: `Assunto: ${subject}`,
    text: `Nome:${name}\nE-mail: ${from}\nTelefone: ${phone}\n${text}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
      res.send("Error sendling email");
    } else {
      console.log("Email sent: " + info.response);
      res.send("Email sent");
    }
  });
});

app.use("/", router);

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor Rodando na porta ${port}`);
});
