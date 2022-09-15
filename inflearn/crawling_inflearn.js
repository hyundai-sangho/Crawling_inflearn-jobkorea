// axios - 특정 웹사이트 페이지 내용을 가져오기
// cheerio - HTML 구조를 가지고 있는 일반 텍스트를 자바스크립트에서
// document 객체의 내장 함수를 사용해서 html 요소에 접근하는 것과 유사한 함수를 제공

const axios = require("axios")
const cheerio = require("cheerio")

// 파일 입출력 모듈
const fs = require("fs")

const 인프런_HTML_가져오기 = async (검색키워드) => {
  try {
    const html = (await axios.get(`https://www.inflearn.com/courses?s=${encodeURI(검색키워드)}`)).data

    return html
  } catch (e) {
    console.log(`에러: ${e}`)
  }
}

const parsing = async (페이지) => {
  const $ = cheerio.load(페이지)
  const courses = []
  const $courseList = $(".course_card_item")

  $courseList.each((index, node) => {
    const 강의제목 = $(node).find(".course_title:eq(0)").text()
    const 강사 = $(node).find(".instructor:eq(0)").text()
    let 강의할인가 = 0
    let 강의정가 = 0
    if ($(node).find(".pay_price").length > 0) {
      강의할인가 = $(node).find(".pay_price:eq(0)").text()
      강의정가 = $(node).find("del:eq(0)").text()
    } else {
      강의할인가 = $(node).find(".price:eq(0)").text()
      강의정가 = 강의할인가
    }

    if ($(node).find(".price") === "무료") {
      강의할인가 = "무료"
      강의정가 = "무료"
    }

    const 평가 = Math.ceil($(node).find(".star_solid").css("width").slice(0, -1))
    const 평가후기_갯수 = $(node).find(".review_cnt:eq(0)").text().slice(1, -1)
    const 이미지소스 = $(node).find(".card-image > figure > img").attr("src")

    courses.push({
      강의제목,
      강사,
      강의할인가,
      강의정가,
      이미지소스,
      평가,
    })
  })

  return courses
}

const 강의코스_가져오기 = async (검색키워드) => {
  const html = await 인프런_HTML_가져오기(검색키워드)
  let courses = await parsing(html)

  // console.log(courses)

  // courses 내용을 inflearnData.json 파일로 출력
  // fs.writeFile("inflearnData.json", JSON.stringify(courses), "utf8", (err) => console.log(err))

  return courses
}

const getFullCourse = async () => {
  let courses = []
  let i = 1

  while (i <= 20) {
    const course = await 강의코스_가져오기(`자바스크립트&order=search&page=${i}`)
    courses = courses.concat(course)
    i++
  }

  console.log("courses.length: " + courses.length)
}

getFullCourse()
