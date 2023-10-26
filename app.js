const express = require("express");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();
const uri = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Hello to my app");
});

// GET and POST newsLetter
app.get("/newsletter", async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("portfolio");
    const newsletterCollection = database.collection("newsletterEmails");

    const pipeline = [];

    const allNewsletterEmails = await newsletterCollection
      .aggregate(pipeline)
      .toArray();

    res.json(allNewsletterEmails);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Ocorreu um erro ao tentar buscar os emails.");
  } finally {
    await client.close();
  }
});

app.post("/newsletter", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "O email é obrigatório" });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("portfolio");
    const newsletterCollection = database.collection("newsletterEmails");

    const existingEmail = await newsletterCollection.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const result = await newsletterCollection.insertOne({ email });

    res.status(201).json({
      message: "Email adicionado com sucesso",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .send("Ocorreu um erro ao tentar adicionar o email à coleção.");
  } finally {
    await client.close();
  }
});

//SEND emails
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "almeidavalmir76@gmail.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post("/send-email", (req, res) => {
  const { from, fullName, phone, subject, text } = req.body;
  if (!fullName || !from || !subject || !text) {
    res.status(400).json({
      error: "Todoss os campos são obrigatórios",
    });
  }

  const mailOptions = {
    from: from,
    to: "almeidavalmir76@gmail.com",
    subject: `Assunto: ${subject}`,
    text: `Nome:${fullName}\nE-mail: ${from}\nTelefone: ${phone}\n${text}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Erro ao enviar e-mail", error);
      res.send("Erro ao enviar e-mail");
    } else {
      console.log("E-mail enviado: " + info.response);
      res.send("E-mail Enviado");
    }
  });
});

app.listen({
  host: "0.0.0.0",
  port: process.env.PORT,
});
