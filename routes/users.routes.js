import express from "express";
import * as User from "../models/user.model.js";
import {isNumbersOnly, isValidEmail, isValidUUID} from "../utils/helpers.js";
const PSQL_ERRORS = {
  UNIQUE_VIOLATION:{
    CODE:'23505',
  },
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// import * from "../utils/helpers.js"
const router = express.Router();

router.get("/", async (req, res) => {
  const Users = await User.findAll();
  res.json(Users);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "id required" });
  }
  if(!isValidUUID(id)){
    return res.status(400).json({ error: "id is not valid uuid"});
  }
  try{
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);

  }
  catch(err){
    console.log(err);
  }
});

router.post("/", async (req, res) => {
  const { full_name, phone, email } = req.body;
  if (!full_name || !email || !phone) {
    return res.status(400).json({ error: "full_name, phone, and email required" });
  }
  if(!isValidEmail(email)){
    return res.status(400).json({error: "invalid email format"});
  }

  if(!isNumbersOnly(phone)){
    return res.status(400).json({error: 'invalid phone format'})
  }
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    if(err.code === PSQL_ERRORS.UNIQUE_VIOLATION.CODE){
          res.status(409).json({ error: err?.message });
    }
    else{

      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.put("/:id", async (req, res) => {

  const { full_name, phone, email, description } = req.body;
  const { id } = req.params;
  if (!full_name && !email && !phone && !description) {
    return res.status(400).json({ error: "at least one of the fields is required: full_name, phone, email, description" });
  }

  if(!isValidUUID(id)){
    return res.status(400).json({ error: "id is not valid uuid"});
  }

    if(!isValidEmail(email)){
    return res.status(400).json({error: "invalid email format"});
  }

  if(!isNumbersOnly(phone)){
    return res.status(400).json({error: 'invalid phone format'})
  }

  try{
    const user = await User.update(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(201).json(user);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error"});
  }
  res.json(User);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if(!isValidUUID(id)){
    return res.status(400).json({ error: "id is not valid uuid"});
  }
  try{
    const ok = await User.remove(id);
    if(!ok){
      res.status(404).json({ error: "Not found" });
  }
  res.status(200).json({ message: "User deleted successfully" });
  }
  
  catch(err){
    console.log(err);
    res.status(400).json({ error: `Invalid request: ${err?.message}` });
  }
  
});

export default router;
