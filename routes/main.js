const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const uri = require("../config/keys").MongoURI;

const Products_Model = require("../models/Products");

// TEST
// @GET TEST
// GET
router.get("/test", (req, res) => {
  res.send("Working");
});

// Database CRUD Operations
// @POST Request to GET the People
// GET
router.get("/getallproductapi", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  Products_Model.find({})
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

router.get("/fetch_users/:page/:rowsPerPage", (req, res) => {
  async function fetchUsersList() {
    try {
      const { page, rowsPerPage } = req.params;
      await client.connect();
      const database = client.db("SearchSAAS");
      const collection = database.collection(`Users`);
      const usersList = await collection
        .find()
        .sort({ id: -1 })
        .limit(Number(rowsPerPage))
        .skip(Number(page))
        .toArray();
      res.json({ users: usersList });
    } catch (err) {
      res.json({ error: err.message });
    }
  }
  fetchUsersList();
});

router.post("/filter_users", (req, res) => {
  async function fetchUsersList() {
    try {
      const search = req.body;
      await client.connect();
      const database = client.db("SearchSAAS");
      const collection = database.collection(`Users`);
      let filterData = {
        name: "NO-DATA",
        company: "NO-DATA",
        linkedin: "NO-DATA",
        designation: "NO-DATA",
        phone: "NO-DATA",
        // email: "NO-DATA",
      };
      if (search?.name?.length > 0)
        filterData.name = new RegExp(search?.name, "i");
      if (search?.company?.length > 0)
        filterData.company = new RegExp(search?.company, "i");
      if (search?.linkedin?.length > 0)
        filterData.linkedin = new RegExp(search?.linkedin, "i");
      if (search?.design?.length > 0)
        filterData.designation = new RegExp(search?.design, "i");
      // if (search?.email?.length > 0)
      //   filterData.email = new RegExp(search?.email, "i");
      if (search?.phone?.length > 0)
        filterData.phone = new RegExp(search?.phone, "i");

      console.log(filterData);

      const usersList = await collection
        .find({
          $or: [
            { first_name: filterData.name },
            { last_name: filterData.name },
            { job_company_name: filterData.company },
            { linkedin_username: filterData.linkedin },
            { job_title_role: filterData.designation },
            // { email: filterData.email },
            { mobile_phone: filterData.phone },
          ],
        })
        .limit(600)
        .toArray();

      res.json({ users: usersList });
    } catch (err) {
      res.json({ error: err.message });
    }
  }
  fetchUsersList();
});

router.get("/fetch_saved_users", (req, res) => {
  async function fetchUsersList() {
    try {
      await client.connect();
      const database = client.db("SearchSAAS");

      const collection = database.collection(`SavedUsers`);

      const usersList = await collection.find().toArray();
      res.json({ users: usersList, error: "" });
    } catch (err) {
      res.json({ error: err.message, users: "" });
    }
  }
  fetchUsersList();
});

router.post("/add-user", (req, res) => {
  async function saveUsersList() {
    try {
      await client.connect();
      const database = client.db("SearchSAAS");

      const collection1 = database.collection(`SavedUsers`);
      const query = req.body;
      const alreadyExists = await collection1.count(query, { limit: 1 });
      if (alreadyExists == 1) {
        return res.json({ error: "This user is already saved!", refNo: "" });
      }
      //  const userData=await collection.find(query)
      const result = await collection1.insertOne(query);
      return res.json({ refNo: result.insertedId, error: "" });
    } catch (err) {
      return res.json({ error: err.message, refNo: "" });
    }
  }
  saveUsersList();
});

module.exports = router;
