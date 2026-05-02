Flow การทำงานของเกม:

ผู้เล่นเปิดหน้า Speed Logic
↓
คลิกในสนามเล่นเพื่อเริ่มเกม
↓
ระบบนับถอยหลัง 3 วินาที
↓
ระบบสุ่มโจทย์ขึ้นมา
↓
ผู้เล่นเลือกคำตอบ
↓
ระบบตรวจถูก/ผิดและบันทึก response time
↓
ระบบปรับระดับความยากตาม performance
↓
เมื่อหมดเวลา ระบบสร้าง result object
↓
redirect ไปหน้า result

--------------------------------------------------------------------------------------------------------------------
Core

constants.ts
ไฟล์นี้เก็บค่าคงที่หลักของเกม

ค่าที่กำหนดในไฟล์นี้:
durationMs
initialDifficulty
minDifficulty
maxDifficulty
answerChoiceCount
streakToIncreaseDifficulty
mistakesToDecreaseDifficulty
minAnswerDelayMs
QUESTION_TYPES

หน้าที่หลัก:
กำหนดเวลาการเล่น
กำหนดระดับความยากเริ่มต้นและขอบเขตความยาก
กำหนดจำนวนตัวเลือกต่อคำถาม
กำหนดเงื่อนไขการเพิ่ม/ลดความยาก
กำหนดประเภทคำถามที่ใช้ในเกม

ไฟล์นี้ถูกใช้โดย:
questionGenerator.ts
difficulty.ts
scoring.ts
useSpeedLogicGame.ts


types.ts
ไฟล์นี้เก็บ TypeScript types ทั้งหมดของ Speed Logic:
GameStatus
QuestionType
AnswerChoice
SpeedLogicQuestion
AnswerRecord
SpeedLogicLiveStats
SpeedLogicResult

หน้าที่หลัก:
กำหนดรูปแบบของคำถาม
กำหนดรูปแบบของตัวเลือกคำตอบ
กำหนด record ของคำตอบแต่ละข้อ
กำหนด live stats ระหว่างเล่น
กำหนด result object หลังจบเกม

ไฟล์นี้ช่วยให้ข้อมูลระหว่าง engine, hook, component และ result page มีโครงสร้างที่ชัดเจน

--------------------------------------------------------------------------------------------------------------------
Engine

engine/rng.ts
ไฟล์นี้จัดการระบบสุ่มแบบมี seed แทนการใช้ Math.random() โดยตรง

ฟังก์ชันหลัก:
createRng()
randomInt()
randomFloat()
shuffleArray()

หน้าที่หลัก:
สร้าง random generator จาก session seed
สุ่มเลข integer
สุ่มเลข float
สุ่มลำดับ array เช่น ตัวเลือกคำตอบ

เหตุผลที่ใช้ seed:
ทำให้ debug ง่ายขึ้น
สามารถอ้างอิง session เดิมได้
ทำให้ระบบสุ่มเป็นระเบียบและควบคุมได้มากกว่า Math.random()

ถูกใช้โดย:
questionGenerator.ts
useSpeedLogicGame.ts


engine/questionGenerator.ts
ไฟล์นี้ทำหน้าที่สร้างคำถามทั้งหมดของเกม

ประเภทคำถามที่รองรับ:
addition
subtraction
multiplication
comparison
odd_even
true_false

ฟังก์ชันหลัก:
generateQuestion()

หน้าที่หลัก:
เลือกประเภทคำถามตามระดับความยาก
สร้างโจทย์ตัวเลขหรือ logic
สร้างตัวเลือกคำตอบ
ระบุตัวเลือกที่ถูกต้อง
กำหนด difficulty ให้กับคำถาม
บันทึกเวลาที่คำถามถูกสร้างผ่าน createdAt

ตัวอย่างโจทย์:
8 + 5 = ?
24 - 9 = ?
7 × 6 = ?
เลขไหนมากกว่า?
35 เป็นเลขอะไร?
12 + 9 = 21

ความเชื่อมโยง:
useSpeedLogicGame.ts
  ↓
generateQuestion()
  ↓
SpeedLogicQuestion
  ↓
QuestionCard.tsx


engine/difficulty.ts
ไฟล์นี้จัดการการเพิ่มและลดความยากของเกมแบบ adaptive difficulty

ฟังก์ชันหลัก:
updateDifficulty()

หลักการทำงาน:
ถ้าผู้เล่นตอบถูกต่อเนื่องครบตามจำนวนที่กำหนด จะเพิ่มระดับความยาก
ถ้าผู้เล่นตอบผิดติดกันตามจำนวนที่กำหนด จะลดระดับความยาก
ความยากจะไม่ต่ำกว่า minDifficulty
ความยากจะไม่สูงกว่า maxDifficulty

ค่าที่ใช้ควบคุมมาจาก constants.ts:
streakToIncreaseDifficulty
mistakesToDecreaseDifficulty
minDifficulty
maxDifficulty

ไฟล์นี้ถูกเรียกใช้หลังจากผู้เล่นตอบคำถามแต่ละข้อใน useSpeedLogicGame.ts


engine/scoring.ts
ไฟล์นี้ใช้คำนวณค่าสถิติและคะแนนของเกม

ฟังก์ชันหลัก:
calculatePercentage()
calculateAverage()
calculateThroughput()
calculateProcessingScore()
buildQuestionTypeBreakdown()
calculateFastestResponse()
calculateSlowestResponse()
isAnswerTooFast()

หน้าที่หลัก:
คำนวณ accuracy
คำนวณ response time เฉลี่ย
คำนวณ throughput หรือจำนวนคำตอบถูกต่อวินาที
คำนวณ processing score
สร้าง breakdown แยกตามประเภทคำถาม
หาคำตอบที่เร็วที่สุดและช้าที่สุด
กันการกดเร็วผิดปกติผ่าน minAnswerDelayMs

ตัวอย่าง metric ที่ได้:
Accuracy
Average Response Time
Fastest Response
Slowest Response
Throughput
Processing Score
Question Type Breakdown

ไฟล์นี้ไม่ยุ่งกับ UI โดยตรง แต่รับข้อมูลจาก answer records แล้วคำนวณเป็นผลลัพธ์ที่ใช้แสดงในหน้าเว็บและส่งต่อ backend

--------------------------------------------------------------------------------------------------------------------
Hook

hooks/useSpeedLogicGame.ts
ไฟล์นี้เป็น core controller ของเกม Speed Logic

หน้าที่หลัก:
เริ่มเกม
รีเซ็ตเกม
จบเกม
สร้างคำถามใหม่
รับคำตอบจากผู้เล่น
ตรวจคำตอบถูก/ผิด
บันทึก response time
ปรับ difficulty
คำนวณ live stats
สร้าง final result
บันทึก result ลง localStorage
ส่ง result ผ่าน onFinish callback

ค่าที่ hook ส่งออกให้หน้าเกมใช้:
status
currentQuestion
liveStats
latestResult
startGame()
resetGame()
finishGame()
answerQuestion()

ไฟล์นี้เชื่อม engine หลักทั้งหมดเข้าด้วยกัน:
rng.ts
questionGenerator.ts
difficulty.ts
scoring.ts

ลำดับการทำงานหลัก:
startGame()
  ↓
resetInternalState()
  ↓
createNextQuestion()
  ↓
ผู้เล่นตอบคำถาม
  ↓
answerQuestion()
  ↓
บันทึก AnswerRecord
  ↓
updateDifficulty()
  ↓
createNextQuestion()
  ↓
หมดเวลา
  ↓
finishGame()
  ↓
สร้าง SpeedLogicResult

--------------------------------------------------------------------------------------------------------------------
Components

components/QuestionCard.tsx
ไฟล์นี้เป็น component หลักของสนามเล่น Speed Logic

หน้าที่หลัก:
แสดงพื้นที่เล่นหลัก
แสดง overlay “กดเพื่อเริ่มเล่น”
แสดง countdown 3 วินาทีก่อนเริ่มเกม
แสดงโจทย์ปัจจุบัน
แสดงประเภทคำถามและ level
แสดงปุ่มตัวเลือกคำตอบ
วางปุ่ม reset มุมขวาบนของสนามเล่น

สถานะที่รองรับ:
idle
countdown
playing
finished

การเชื่อมโยง:
speedLogic.tsx
  ↓
QuestionCard.tsx
  ↓
AnswerButton.tsx


components/AnswerButton.tsx
ไฟล์นี้เป็นปุ่มคำตอบแต่ละตัวเลือก

หน้าที่หลัก:
แสดงคำตอบ เช่น ตัวเลข หรือคำว่า ถูก/ผิด
รับ click จากผู้เล่น
ส่ง choice.id กลับไปให้ QuestionCard
จากนั้น QuestionCard ส่งต่อไปยัง answerQuestion()

การไหลของข้อมูล:
ผู้เล่นคลิกคำตอบ
↓
AnswerButton
↓
QuestionCard
↓
speedLogic.tsx
↓
answerQuestion(choiceId)
↓
useSpeedLogicGame.ts


components/MetricCard.tsx
ไฟล์นี้เป็น component กล่องแสดงค่าสถิติแบบ reusable

ใช้แสดง metric เช่น:
Time Left
Accuracy
Avg Response
Score
Processing Score
Fastest Response
Max Difficulty
Throughput

ถูกใช้ใน:
speedLogic.tsx
speedLogicResult.tsx


components/ResultPanel.tsx
ไฟล์นี้แสดงผลลัพธ์หลังจบเกมแบบละเอียด และแสดง JSON output ที่พร้อมส่งให้ backend

หน้าที่หลัก:
แสดง score
แสดง accuracy
แสดง average response time
แสดง throughput
แสดง max difficulty
แสดง total answers
แสดง JSON result object

ถูกใช้โดย:
speedLogicResult.tsx

--------------------------------------------------------------------------------------------------------------------
Page

speedLogic.tsx
ไฟล์นี้คือหน้าเล่นเกมจริงของ Speed Logic

หน้าที่หลัก:
แสดง header ของเกม
แสดง metric หลักด้านบน
จัด layout ของสนามเล่น
จัดการ countdown 3 วินาทีก่อนเริ่มเกม
เรียกใช้ useSpeedLogicGame()
ส่งคำตอบของผู้เล่นเข้า hook
redirect ไปหน้า result เมื่อเกมจบ

component ที่ใช้:
SiteHeader
SiteFooter
SpeedLogicIcon
MetricCard
QuestionCard

flow สำคัญ:
ผู้เล่นคลิกในสนามเล่น
↓
speedLogic.tsx เริ่ม countdown 3 วินาที
↓
ครบ 3 วินาที เรียก startGame()
↓
QuestionCard แสดงโจทย์
↓
ผู้เล่นเลือกคำตอบ
↓
answerQuestion() ตรวจคำตอบ
↓
หมดเวลา
↓
navigate('/gameplay/speedlogic/result')


speedLogicResult.tsx
ไฟล์นี้คือหน้าผลลัพธ์หลังเล่นจบ

หน้าที่หลัก:
รับ result จาก route state
ถ้าไม่มี route state จะดึงข้อมูลจาก localStorage
แสดงค่าสถิติหลักหลังจบเกม
แสดง performance breakdown
แสดง breakdown แยกตามประเภทคำถาม
แสดง JSON output สำหรับ backend

ข้อมูลที่แสดง:
Processing Score
Accuracy
Average Response Time
Fastest Response
Slowest Response
Max Difficulty
Final Difficulty
Throughput
Total Answers
Correct Answers
Wrong Answers
Question Type Breakdown
JSON Output

ไฟล์นี้ใช้:
MetricCard
ResultPanel
SpeedLogicResult type

--------------------------------------------------------------------------------------------------------------------
Result Object

หลังเล่นจบ ระบบจะสร้าง result object ในรูปแบบนี้:

{
  gameType: 'speed_logic',
  sessionSeed: number,
  durationMs: number,

  score: number,
  accuracy: number,
  avgResponseTimeMs: number,
  fastestResponseMs: number,
  slowestResponseMs: number,

  totalAnswers: number,
  correctAnswers: number,
  wrongAnswers: number,

  maxDifficulty: number,
  finalDifficulty: number,
  throughput: number,

  questionTypeBreakdown: {
    addition: {
      total: number,
      correct: number,
      accuracy: number,
      avgResponseTimeMs: number
    },
    subtraction: {
      total: number,
      correct: number,
      accuracy: number,
      avgResponseTimeMs: number
    },
    multiplication: {
      total: number,
      correct: number,
      accuracy: number,
      avgResponseTimeMs: number
    },
    comparison: {
      total: number,
      correct: number,
      accuracy: number,
      avgResponseTimeMs: number
    },
    odd_even: {
      total: number,
      correct: number,
      accuracy: number,
      avgResponseTimeMs: number
    },
    true_false: {
      total: number,
      correct: number,
      accuracy: number,
      avgResponseTimeMs: number
    }
  },

  answers: AnswerRecord[],
  playedAt: string
}

Result นี้ถูกเก็บไว้ใน:
localStorage key: latest_speed_logic_result
console log: SPEED_LOGIC_RESULT

และสามารถนำไปส่ง backend ได้โดยตรง