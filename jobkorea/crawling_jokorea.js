const axios = require("axios")
const cheerio = require("cheerio")

// require("dotenv").config({ path: "nodemailer/.env" })
const nodemailer = require("nodemailer")
const senderInfo = require("./config/senderInfo.json")

const cron = require("node-cron")

const 잡코리아_HTML_가져오기 = async (검색키워드) => {
  try {
    const html = (await axios.get(`https://www.jobkorea.co.kr/Search/?stext=${encodeURI(검색키워드)}`)).data

    return html
  } catch (e) {
    console.log("에러 : " + e)
  }
}

const parsing = async (페이지) => {
  const $ = cheerio.load(페이지)
  const jobs = []
  const $jobList = $(".post")
  $jobList.each((index, node) => {
    const jobTitle = $(node).find(".title:eq(0)").text().trim()
    const company = $(node).find(".name:eq(0)").text().trim()
    const experience = $(node).find(".exp:eq(0)").text().trim()
    const education = $(node).find(".edu:eq(0)").text().trim()
    const regularYN = $(node).find(".option > span:eq(2)").text().trim()
    const region = $(node).find(".long:eq(0)").text().trim()
    const dueDate = $(node).find(".date:eq(0)").text().trim()
    const etc = $(node).find(".etc:eq(0)").text().trim()

    if (experience.indexOf("신입") > -1 || experience.indexOf("경력무관") > -1) {
      jobs.push({
        jobTitle,
        company,
        experience,
        education,
        regularYN,
        region,
        dueDate,
        etc,
      })
    }
  })

  return jobs
}

const 직업가져오기 = async (검색키워드) => {
  const html = await 잡코리아_HTML_가져오기(검색키워드)
  const jobs = await parsing(html)

  console.log(jobs)

  return jobs
}

const crawlingJob = async (검색키워드) => {
  const jobs = await 직업가져오기("node.js")

  const h = []
  h.push(`<table style="border:1px solid black; border-collapse:collapse;">`)
  h.push(`<thead>`)
  h.push(`<tr>`)
  h.push(`<th style="border:1px solid black;">구인제목</th>`)
  h.push(`<th style="border:1px solid black;">회사명</th>`)
  h.push(`<th style="border:1px solid black;">경력</th>`)
  h.push(`<th style="border:1px solid black;">학력</th>`)
  h.push(`<th style="border:1px solid black;">정규직여부</th>`)
  h.push(`<th style="border:1px solid black;">지역</th>`)
  h.push(`<th style="border:1px solid black;">구인마감일</th>`)
  h.push(`<th style="border:1px solid black;">비고</th>`)
  h.push(`</tr>`)
  h.push(`</thead>`)
  h.push(`<tbody>`)
  jobs.forEach((job) => {
    h.push(`<tr>`)
    h.push(`<td style="border:1px solid black;">${job.jobTitle}</td>`)
    h.push(`<td style="border:1px solid black;">${job.company}</td>`)
    h.push(`<td style="border:1px solid black;">${job.experience}</td>`)
    h.push(`<td style="border:1px solid black;">${job.education}</td>`)
    h.push(`<td style="border:1px solid black;">${job.regularYN}</td>`)
    h.push(`<td style="border:1px solid black;">${job.region}</td>`)
    h.push(`<td style="border:1px solid black;">${job.dueDate}</td>`)
    h.push(`<td style="border:1px solid black;">${job.etc}</td>`)
    h.push(`</tr>`)
  })
  h.push(`</tbody>`)
  h.push(`</table>`)

  const mailPoster = nodemailer.createTransport({
    service: "Naver",
    host: "smtp.naver.com",
    port: 587,
    auth: {
      user: senderInfo.user,
      pass: senderInfo.pass,
    },
  })

  // 메일을 받을 유저 설정
  const mailOpt = () => {
    const mailOptions = {
      from: "hyundai_sangho@naver.com",
      to: "teha007@naver.com, chosangho2019@gmail.com",
      subject: "Node.js 구인 회사 정보",
      html: h.join(""),
    }

    return mailOptions
  }

  // 메일 전송
  const sendMail = (mailOptions) => {
    mailPoster.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("에러 " + error)
      } else {
        console.log("전송 완료 " + info.response)
      }
    })
  }

  sendMail(mailOpt())

  // const emailData = {
  //   from: "hyundai_sangho@naver.com",
  //   to: "hyundai_sangho@navr.com, chosangho2019@gmail.com",
  //   subject: "Node.js 구인 회사 정보",
  //   html: h.join(""),
  // }

  // await nodemailer.send(emailData)
}

// "*/1 * * * *" => 1분 마다 보낼 때 사용
// 매일 아침 7시에 크롤링이 전송되고, 수집된 결과를 이메일로 전송
cron.schedule("0 7 * * *", async () => {
  crawlingJob("node.js")
})
