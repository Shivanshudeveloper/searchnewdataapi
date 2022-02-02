const express = require('express')
const router = express.Router()
const faker = require('faker')
const { MongoClient } = require('mongodb')
const uri = require('../config/keys').MongoURI

const Products_Model = require('../models/Products')
const Campaign = require('../models/Campaigns')
const SavedDetail = require('../models/SaveDetails')
const nodemailer = require('nodemailer')
const { names } = require('../seedData/names.js')
const { industries } = require('../seedData/industries.js')
const { jobs } = require('../seedData/jobs.js')
const { temp } = require('../seedData/temp.js')

console.log(names.length)

// TEST
// @GET TEST
// GET
router.get('/test', (req, res) => {
  res.send('Working')
})

// Database CRUD Operations
// @POST Request to GET the People
// GET
router.get('/getallproductapi', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  Products_Model.find({})
    .then((data) => {
      res.status(200).json(data)
    })
    .catch((err) => res.status(400).json(`Error: ${err}`))
})

const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})

router.get('/fetch_users/:page/:rowsPerPage', (req, res) => {
  async function fetchUsersList() {
    try {
      const { page, rowsPerPage } = req.params
      await client.connect()
      const database = client.db('SearchSAAS')
      const collection = database.collection(`Users`)
      const usersList = await collection
        .find()
        .sort({ id: -1 })
        .limit(Number(rowsPerPage))
        .skip(Number(page))
        .toArray()
      res.json({ users: usersList })
    } catch (err) {
      res.json({ error: err.message })
    }
  }
  fetchUsersList()
})

router.post('/search_users', (req, res) => {
  async function fetchUsersList() {
    try {
      const { searchField } = req.body
      await client.connect()
      const database = client.db('SearchSAAS')
      const collection = database.collection(`Users`)
      const field = new RegExp(searchField, 'i')
      const usersList = await collection
        .find({
          $or: [
            { first_name: field },
            { last_name: field },
            { job_company_name: field },
            { linkedin_username: field },
            { job_title_role: field },
            { work_email: field },
            { mobile_phone: field },
          ],
        })
        .limit(200)
        .toArray()

      res.json({ users: usersList })
    } catch (err) {
      res.json({ error: err.message })
    }
  }
  fetchUsersList()
})
router.post('/filter_users', (req, res) => {
  async function fetchUsersList() {
    try {
      const search = req.body
      await client.connect()
      const database = client.db('SearchSAAS')
      const collection = database.collection(`Users`)
      let filterData = {
        name: 'NO-DATA',
        company: 'NO-DATA',
        linkedin: 'NO-DATA',
        designation: 'NO-DATA',
        phone: 'NO-DATA',
        email: 'NO-DATA',
      }
      if (search?.name?.length > 0)
        filterData.name = new RegExp(search?.name, 'i')
      if (search?.company?.length > 0)
        filterData.company = new RegExp(search?.company, 'i')
      if (search?.linkedin?.length > 0)
        filterData.linkedin = new RegExp(search?.linkedin, 'i')
      if (search?.design?.length > 0)
        filterData.designation = new RegExp(search?.design, 'i')
      if (search?.email?.length > 0)
        filterData.email = new RegExp(search?.email, 'i')
      if (search?.phone?.length > 0)
        filterData.phone = new RegExp(search?.phone, 'i')

      console.log(filterData)

      const usersList = await collection
        .find({
          $or: [
            { first_name: filterData.name },
            { last_name: filterData.name },
            { job_company_name: filterData.company },
            { linkedin_username: filterData.linkedin },
            { job_title_role: filterData.designation },
            { work_email: filterData.email },
            { mobile_phone: filterData.phone },
          ],
        })
        .limit(600)
        .toArray()

      res.json({ users: usersList })
    } catch (err) {
      res.json({ error: err.message })
    }
  }
  fetchUsersList()
})

router.get('/fetch_saved_users', (req, res) => {
  async function fetchUsersList() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection = database.collection(`SavedUsers`)

      const usersList = await collection.find().toArray()
      res.json({ users: usersList, error: '' })
    } catch (err) {
      res.json({ error: err.message, users: '' })
    }
  }
  fetchUsersList()
})

router.post('/add-all-user', (req, res) => {
  async function saveUsersList() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection1 = database.collection(`SavedUsers`)
      const collection2 = database.collection(`Users`)
      const query = req.body

      //  const userData=await collection.find(query)
      query.forEach(async (_id) => {
        try {
          const result1 = await collection2.find({ id: _id })
          const alreadyExists = await collection1.countDocuments(result1, {
            limit: 1,
          })
          if (alreadyExists == 1) {
            return res.json({
              error: 'This user is already saved!',
              refNo: '',
            })
          }
          console.log(result1)
          const data = {
            id: result1.id,
            first_name: result1.first_name,
            last_name: result1.last_name,
            company: result1.job_company_name,
            designation: result1.job_title,
            country: result1.location_country,
            linkedin: result1.linkedin_result1name,
            email:
              result1 && result1.emails && result1.emails.length > 0
                ? result1.emails[0].address
                : 'N/A',
            userInfoCompressed: result1,
          }
          // const result = await collection1.insertOne(data);
        } catch (error) {
          console.log(error)
        }
      })
      return res.json({ refNo: '', error: '' })
    } catch (err) {
      return res.json({ error: err.message, refNo: '' })
    }
  }
  saveUsersList()
})
router.post('/add-user', (req, res) => {
  async function saveUsersList() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection1 = database.collection(`SavedUsers`)
      const query = req.body
      const alreadyExists = await collection1.count(query, { limit: 1 })
      if (alreadyExists == 1) {
        return res.json({ error: 'This user is already saved!', refNo: '' })
      }
      //  const userData=await collection.find(query)
      const result = await collection1.insertOne(query)
      return res.json({ refNo: result.insertedId, error: '' })
    } catch (err) {
      return res.json({ error: err.message, refNo: '' })
    }
  }
  saveUsersList()
})

router.post('/saveemail', (req, res) => {
  async function saveEmail() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection1 = database.collection(`EmailCampaign`)
      const query = req.body
      const alreadyExists = await collection1.count(query, { limit: 1 })
      if (alreadyExists == 1) {
        return res.json({
          error: 'This template is already saved!',
          refNo: '',
        })
      }
      const result = await collection1.insertOne(query)
      console.log(result.insertedId)
      return res.json({ refNo: result.insertedId, error: '' })
    } catch (err) {
      return res.json({ error: err.message, refNo: '' })
    }
  }
  saveEmail()
})

router.post('/savecall', (req, res) => {
  async function saveCall() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection1 = database.collection(`CallCampaign`)
      const query = req.body

      const result = await collection1.insertOne(query)
      console.log(result.insertedId)
      return res.json({ refNo: result.insertedId, error: '' })
    } catch (err) {
      return res.json({ error: err.message, refNo: '' })
    }
  }
  saveCall()
})

router.get('/getcall', (req, res) => {
  async function fetchUsersList() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection = database.collection(`CallCampaign`)

      const usersList = await collection.find().toArray()
      res.json({ users: usersList, error: '' })
    } catch (err) {
      res.json({ error: err.message, users: '' })
    }
  }
  fetchUsersList()
})
router.post('/savetask', (req, res) => {
  async function saveCall() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection1 = database.collection(`TaskCampaign`)
      const query = req.body

      const result = await collection1.insertOne(query)
      console.log(result.insertedId)
      return res.json({ refNo: result.insertedId, error: '' })
    } catch (err) {
      return res.json({ error: err.message, refNo: '' })
    }
  }
  saveCall()
})

router.get('/gettask', (req, res) => {
  async function fetchUsersList() {
    try {
      await client.connect()
      const database = client.db('SearchSAAS')

      const collection = database.collection(`TaskCampaign`)

      const usersList = await collection.find().toArray()
      res.json({ users: usersList, error: '' })
    } catch (err) {
      res.json({ error: err.message, users: '' })
    }
  }
  fetchUsersList()
})

// Database CRUD Operations
// @GET Request to GET random details of random users
// GET
router.get('/random', (req, res) => {
  try {
    const randomData = []
    const fixData = {
      firstName: 'Mary',
      lastName: 'Joxi',
      email: 'marycard@hotmail.com',
      phoneNumber: '4222 99382 12 2',
      company: 'Infosys',
      industry: 'Textile',
      jobRole: 'Software Engineer',
      country: 'Portugal',
      facebookProfile: 'mary.net',
      linkedinProfile: 'mary.net',
    }

    //let i = 0

    //const xx = names.slice(0, 1000)
    console.log('fetching random data')

    for (let i = 0; i < 2000; i++) {
      const card = faker.helpers.createCard()
      const jobIndex = Math.floor(Math.random() * jobs.length)
      const industryIndex = Math.floor(Math.random() * industries.length)

      if (i === 5) {
        randomData.push(fixData)
      }
      //console.log(i)
      const data = {
        firstName: names[i].firstName,
        lastName: names[i].lastName,
        email: names[i].email,
        phoneNumber: names[i].phoneNumber || card.phone,
        company: names[i].company || card.company.name,
        industry: names[i].industry || industries[industryIndex],
        jobRole: names[i].jobRole || jobs[jobIndex],
        country: names[i].country || card.address.country,
        facebookProfile: names[i].facebookProfile || card.website,
        linkedinProfile: names[i + 70000].linkedinProfile || card.website,
      }
      randomData.push(data)
    }
    console.log('fetched random data')
    res.send(randomData)
  } catch (error) {
    console.log(error)
    res.send(`Internal Server Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @GET Request to GET random details of random users after filter
// GET
router.get('/filter/:count', (req, res) => {
  try {
    const { count } = req.params
    const randomData = []

    let first = false
    let last = false
    let company = false
    let job = false
    let industry = false

    for (let i = 66500; i < names.length; i++) {
      if (
        req.query.firstName !== '' &&
        names[i].firstName
          .toLowerCase()
          .includes(req.query.firstName.toLowerCase())
      ) {
        first = true
      }

      if (
        req.query.lastName !== '' &&
        names[i].lastName
          .toLowerCase()
          .includes(req.query.lastName.toLowerCase())
      ) {
        last = true
      }

      if (
        req.query.company !== '' &&
        names[i].company.toLowerCase().includes(req.query.company.toLowerCase())
      ) {
        company = true
      }

      if (
        req.query.industry !== '' &&
        names[i].industry
          .toLowerCase()
          .includes(req.query.industry.toLowerCase())
      ) {
        industry = true
      }

      if (
        req.query.jobRole !== '' &&
        names[i].jobRole.toLowerCase().includes(req.query.jobRole.toLowerCase())
      ) {
        job = true
      }
    }

    if (
      (first === false && req.query.firstName !== '') ||
      (last === false && req.query.lastName !== '') ||
      (company === false && req.query.company !== '') ||
      (job === false && req.query.jobRole !== '') ||
      (industry === false && req.query.industry !== '')
    ) {
      res.send([])
      return
    }

    for (let i = 0; i < count; i++) {
      const card = faker.helpers.createCard()
      const name = card.name.split(' ')
      const jobIndex = Math.floor(Math.random() * jobs.length)
      const industryIndex = Math.floor(Math.random() * industries.length)

      let firstName = null
      let lastName = null
      let companyName = null
      let industryName = null
      let jobName = null

      if (first) {
        firstName = req.query.firstName
      }

      if (last) {
        lastName = req.query.lastName
      }

      if (industry) {
        industryName = req.query.industry
      }

      if (company) {
        companyName = req.query.company
      }

      if (job) {
        jobName = req.query.jobRole
      }

      const data = {
        firstName: firstName || name[0],
        lastName: lastName || name[1],
        email: card.email,
        phoneNumber: card.phone,
        company: companyName || card.company.name,
        industry: industryName || industries[industryIndex],
        jobRole: jobName || jobs[jobIndex],
        country: req.query.country || card.address.country,
        facebookProfile: card.website,
        linkedinProfile: card.website,
      }

      randomData.push(data)
    }
    res.send(randomData)
  } catch (error) {
    console.log(error)
    res.send(`Internal Server Error: ${error.message}`)
  }
})

// @Database CRUD Operations
// @GET Request to GET random details of random users after filter
// GET
router.get('/search/:count', (req, res) => {
  try {
    const { count } = req.params
    const randomData = []

    let first = false
    let last = false
    let company = false
    let job = false
    let industry = false
    let email = false
    let linkedin = false
    let country = false

    for (let i = 66500; i < names.length; i++) {
      if (
        names[i].firstName
          .toLowerCase()
          .includes(req.query.search.toLowerCase())
      ) {
        first = true
        break
      }

      if (
        names[i].lastName.toLowerCase().includes(req.query.search.toLowerCase())
      ) {
        last = true
        break
      }

      if (
        names[i].company.toLowerCase().includes(req.query.search.toLowerCase())
      ) {
        company = true
        break
      }

      if (
        names[i].industry.toLowerCase().includes(req.query.search.toLowerCase())
      ) {
        industry = true
        break
      }

      if (
        names[i].jobRole.toLowerCase().includes(req.query.search.toLowerCase())
      ) {
        job = true
        break
      }

      if (
        names[i].email.toLowerCase().includes(req.query.search.toLowerCase())
      ) {
        email = true
        break
      }

      if (
        names[i].linkedinProfile
          .toLowerCase()
          .includes(req.query.search.toLowerCase())
      ) {
        linkedin = true
        break
      }

      if (
        names[i].country.toLowerCase().includes(req.query.search.toLowerCase())
      ) {
        country = true
        break
      }
    }

    console.log(first, last)

    if (
      last === false &&
      first === false &&
      company === false &&
      job === false &&
      industry === false &&
      email === false &&
      linkedin === false &&
      country === false
    ) {
      res.send([])
      return
    }

    for (let i = 0; i < count; i++) {
      const card = faker.helpers.createCard()
      const name = card.name.split(' ')
      const jobIndex = Math.floor(Math.random() * jobs.length)
      const industryIndex = Math.floor(Math.random() * industries.length)

      let firstName = null
      let lastName = null
      let companyName = null
      let jobName = null
      let industryName = null
      let emailName = null
      let likedinName = null
      let countryName = null

      if (first) {
        firstName = req.query.search
      }

      if (last) {
        lastName = req.query.search
      }

      if (company) {
        companyName = req.query.search
      }
      if (job) {
        jobName = req.query.search
      }
      if (industry) {
        industryName = req.query.search
      }
      if (email) {
        emailName = req.query.search
      }
      if (linkedin) {
        likedinName = req.query.search
      }
      if (country) {
        countryName = req.query.search
      }

      const data = {
        firstName: firstName || name[0],
        lastName: lastName || name[1],
        email: emailName || card.email,
        phoneNumber: card.phone,
        company: companyName || card.company.name,
        industry: industryName || industries[industryIndex],
        jobRole: jobName || jobs[jobIndex],
        country: countryName || card.address.country,
        facebookProfile: card.website,
        linkedinProfile: likedinName || card.website,
      }

      randomData.push(data)
    }
    res.send(randomData)
  } catch (error) {
    console.log(error)
    res.send(`Internal Server Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @POST Request to POSt random details of random users
// POST
router.post('/savedDetails/add', async (req, res) => {
  try {
    const { body } = req.body
    const isExist = await SavedDetail.find({ email: body.email })

    if (isExist.length !== 0) {
      res.json({
        success: false,
      })
      return
    }

    await SavedDetail.create({
      userEmail: body.userEmail,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      company: body.company,
      jobRole: body.jobRole,
      country: body.country,
      facebookProfile: body.facebookProfile,
      linkedinProfile: body.linkedinProfile,
    })

    res.json({
      success: true,
    })
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @GET Request to GET all saved list of a user by userEmail
// GET
router.get('/savedDetails/:email', async (req, res) => {
  try {
    const { email } = req.params
    const data = await SavedDetail.find({ userEmail: email })
    res.status(200)
    res.send(data)
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// ************* Campaign ************** //

// Database CRUD Operations
// @GET Request to GET all campaign of a user
// GET
router.get('/campaigns/:email', async (req, res) => {
  try {
    const { email } = req.params
    const data = await Campaign.find({ email: email })
    res.status(200)
    res.send(data)
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @GET Request to GET specific campaign details
// GET
router.get('/campaign/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = await Campaign.findById({ _id: id })
    res.status(200)
    res.send(data)
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @POST Request to Post the Campaign
// POST
router.post('/campaign/create', async (req, res) => {
  try {
    const { email, campaignName } = req.body
    const data = await Campaign.create({
      campaignName,
      email,
    })

    if (data) {
      res.status(200).send(data)
    }
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @POST Request to Update the Campaign
// POST
router.put('/campaign/update', async (req, res) => {
  try {
    const { id, count } = req.body

    const campaign = await Campaign.findById({ _id: id })

    if (campaign) {
      campaign.mailSend = count || campaign.mailSend
      campaign.mailDelivered = count || campaign.mailDelivered

      const updatedCampaign = await campaign.save()

      res.status(200).send(updatedCampaign)
    } else {
      res.status(404).send({ error: 'Campaign Not Found' })
    }
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// Database CRUD Operations
// @DELETE Deleting campaign using _id
// DELETE
router.delete('/campaign/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = await Campaign.findById({ _id: id })
    if (data) {
      await Campaign.deleteOne({ _id: id })
        .then(() => res.status(200).send('Campaign Deleted Successfully'))
        .catch((error) => console.log(`Error: ${error.message}`))
    } else {
      throw new Error('Campaign not existed !')
    }
  } catch (error) {
    res.send(`Error: ${error.message}`)
  }
})

// ************* sending email to all emails in list ************** //

router.post('/sendEmail', async (req, res) => {
  try {
    const { html, to, subject } = req.body

    console.log(to)

    let transporter = nodemailer.createTransport({
      host: 'smtp.elasticemail.com',
      port: 2525,
      auth: {
        user: 'info@kree.io',
        pass: 'FE06444C4E622A68BE2FDE90E80D5AA93C98',
      },
    })

    let mailOptions = {
      from: 'Kree <info@kree.io>',
      //to: ['codecanyonpru@gmail.com', 'pikojavup@givmail.com'],
      to: [...to, 'hari.om.18659@gmail.com'],
      subject: subject,
      text: 'Kree Mails',
      // html: '<h1>Hello Nodemailer</h1>',
      html: `${html}`,
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error)
      }
      console.log('Message sent: %s', info.messageId)
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))

      // res.render('contact', { msg: 'Email has been sent' })
      res.status(200).json({ msg: 'Email has been sent' })
    })
  } catch (error) {
    console.log(error)
  }
})

// router.get('/gen', (req, res) => {
//   try {
//     const randomData = []

//     const fn = ['何',
// '李',
// '陈',]

//     for (let i = 0; i < 3; i++) {
//       const card = faker.helpers.createCard()
//       const name = faker.name.findName()
//       const names = name.split(' ')
//       const jobIndex = Math.floor(Math.random() * jobs.length)
//       const industryIndex = Math.floor(Math.random() * industries.length)

//       const data = {
//         firstName: fn[i],
//         lastName: names[1],
//         email: card.email,
//         phoneNumber: card.phone,
//         company: card.company.name,
//         industry: industries[industryIndex],
//         jobRole: jobs[jobIndex],
//         country: 'china',
//         facebookProfile: card.website,
//         linkedinProfile: card.website,
//       }
//       randomData.push(data)
//     }
//     console.log('fetched random data')
//     res.send(randomData)
//   } catch (error) {
//     console.log(error)
//     res.send(`Internal Server Error: ${error.message}`)
//   }
// })

module.exports = router
