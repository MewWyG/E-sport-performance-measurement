Dualtask

เกม Aim & Input 
โดยผู้เล่นต้องใช้เมาส์ติดตามเป้าหมายที่เคลื่อนที่บนพื้นที่เล่น พร้อมกับกดปุ่มตามลำดับที่ปรากฏขึ้นบนหน้าจอ ระบบจะเก็บค่าสถิติ เช่น ความแม่นยำในการติดตามเป้าหมาย ความถูกต้องของการกดปุ่ม เวลาตอบสนอง และคะแนนรวม เพื่อเตรียมส่งต่อให้ backend หรือ database ในภายหลัง

--------------------------------------------------------------------------------------------------------------------
Core

constants.ts
ไฟล์นี้ใช้เก็บค่าคงที่หลักของเกม เช่น ระยะเวลาเล่น ขนาด canvas ความเร็วของเป้าหมาย ขนาดเป้าหมาย เวลาที่ sequence ปรากฏ และชุดปุ่มที่ใช้ในเกม
ถูกใช้โดยหลายส่วนของเกม เช่น engine, hook และ canvas เพื่อให้ทุกระบบใช้ค่ากลางเดียวกัน ถ้าต้องการปรับความยากหรือขนาดสนามเล่น จะเริ่มแก้จากไฟล์นี้ก่อน

types.ts
ไฟล์นี้ใช้เก็บ TypeScript types ของเกมทั้งหมด เพื่อให้ข้อมูลที่ส่งระหว่างไฟล์ต่าง ๆ มีรูปแบบที่ชัดเจนและปลอดภัย
หน้าที่หลักของไฟล์นี้คือกำหนดโครงสร้างข้อมูล เช่น เป้าหมายมีค่าอะไรบ้าง ผลลัพธ์หลังจบเกมต้องมี field อะไรบ้าง และ sequence ของปุ่มมีรูปแบบอย่างไร

--------------------------------------------------------------------------------------------------------------------
Engine

engine/rng.ts
ไฟล์นี้ทำหน้าที่สร้างระบบสุ่มแบบมี seed แทนการใช้ Math.random() โดยตรง ทำให้การสุ่มของเกมสามารถควบคุมและ debug ได้ง่ายขึ้น เช่น เป้าหมายเริ่มต้นหรือ sequence ที่สุ่มออกมาสามารถอ้างอิงจาก session seed ได้
ไฟล์นี้ถูกใช้โดย:
targetPhysics.ts
sequenceGenerator.ts
useDualTaskGame.ts

engine/targetPhysics.ts
ไฟล์นี้เป็น engine สำหรับควบคุมการเคลื่อนที่ของเป้าหมายบนสนามเล่น
createInitialTarget() ใช้สร้างตำแหน่งและความเร็วเริ่มต้นของเป้าหมาย
updateTargetPosition() ใช้อัปเดตตำแหน่งของเป้าหมายในแต่ละ frame โดยอาศัย delta time และ elapsed time ทำให้เป้าหมายเคลื่อนที่แบบต่อเนื่อง มีการเปลี่ยนทิศทาง และเด้งกลับเมื่อชนขอบ canvas
ไฟล์นี้ถูกเรียกใช้โดย useDualTaskGame.ts ภายใน game loop

engine/sequenceGenerator.ts
ไฟล์นี้ทำหน้าที่สุ่มชุดปุ่มที่ผู้เล่นต้องกด ระบบจะสร้าง sequence จากชุดปุ่มที่กำหนดใน AVAILABLE_KEYS และสามารถเพิ่มความยากได้ผ่านความยาวของ sequence เช่น เมื่อผู้เล่นเล่นต่อเนื่องมากขึ้น sequence อาจยาวขึ้น
ไฟล์นี้ถูกเรียกใช้โดย useDualTaskGame.ts เพื่อสร้างชุดปุ่มใหม่ระหว่างเล่น

engine/scoring.ts
ไฟล์นี้ทำหน้าที่คำนวณค่าสถิติและคะแนนของเกม ไฟล์นี้ไม่ยุ่งกับ UI โดยตรง แต่จะรับค่าดิบจาก game loop แล้วคำนวณออกมาเป็นค่าที่แสดงบนหน้าเว็บและเก็บใน result object
ไฟล์นี้ถูกใช้โดย useDualTaskGame.ts

--------------------------------------------------------------------------------------------------------------------
Hooks

hooks/useDualTaskGame.ts
ไฟล์นี้เป็นหัวใจหลักของเกม ทำหน้าที่เชื่อม engine ทั้งหมดเข้าด้วยกัน และควบคุม state ของเกม
หน้าที่หลัก:
เริ่มเกม
รีเซ็ตเกม
จบเกม
อัปเดตตำแหน่งเป้าหมาย
รับตำแหน่งเมาส์
รับ keyboard input
สร้าง sequence ใหม่
ตรวจปุ่มถูก/ผิด
คำนวณ live stats
สร้าง final result
บันทึกผลลง localStorage
ส่งผลลัพธ์ผ่าน onFinish callback

ค่าที่ hook ส่งออกให้หน้าเกมใช้:
status
liveStats
latestResult
activeSequence
targetRef
pointerRef
startGame()
resetGame()
finishGame()
updatePointer()

ไฟล์นี้เชื่อมโยงกับ engine หลักทั้งหมด:
rng.ts
targetPhysics.ts
sequenceGenerator.ts
scoring.ts

ถูกเรียกใช้โดยหน้า:
dualtask.tsx

--------------------------------------------------------------------------------------------------------------------
Component

components/DualTaskCanvas.tsx
ไฟล์นี้ทำหน้าที่แสดงพื้นที่เล่นของเกมด้วย HTML Canvas
หน้าที่หลัก:
วาดพื้นหลังสนามเล่น
วาด grid
วาด target
วาด pointer/cursor
วาดเส้นระยะห่างระหว่าง pointer กับ target
รับตำแหน่ง pointer จาก mouse movement
ส่งตำแหน่ง pointer กลับไปให้ hook ผ่าน onPointerMove()
ไฟล์นี้ไม่ได้คำนวณคะแนนเอง แต่ทำหน้าที่แสดงภาพและรับตำแหน่งเมาส์จากผู้เล่น จากนั้นส่งข้อมูลไปให้ useDualTaskGame.ts เป็นคนประมวลผล
ถูกใช้โดย:dualtask.tsx

components/SequenceOverlay.tsx
ไฟล์นี้ทำหน้าที่แสดงลำดับปุ่มที่ผู้เล่นต้องกดในระหว่างเล่น โดยแสดงเป็น overlay อยู่กลางพื้นที่ track
หน้าที่หลัก:
แสดง sequence ปัจจุบัน
ไฮไลต์ปุ่มที่ต้องกดตอนนี้
แสดงปุ่มที่กดถูกแล้วเป็นสถานะ completed
แสดงข้อความรอ sequence ใหม่เมื่อยังไม่มี sequence
ไฟล์นี้รับข้อมูลจาก activeSequence ที่มาจาก useDualTaskGame.ts
ถูกใช้โดย:dualtask.tsx

components/MetricCard.tsx
ไฟล์นี้เป็น component กล่องแสดงค่าสถิติแบบ reusable ใช้หลัก ๆในหน้าresult เพื่อแสดงค่าสถิติหลังจบเกม เช่น:
Multitask Score
Tracking Accuracy
Input Accuracy
Average Reaction
Stability
Completed Sequences
ถูกใช้โดย:dualtaskResult.tsx

components/ResultPanel.tsx
ไฟล์นี้ทำหน้าที่แสดงผลลัพธ์แบบละเอียดและ JSON output หลังเล่นจบ
หน้าที่หลัก:
แสดงค่าสถิติสำคัญหลังจบเกม
แสดง JSON result ที่พร้อมส่งให้ backend
ช่วยตรวจสอบว่า data object มี field ครบหรือไม่
ไฟล์นี้รับข้อมูล DualTaskResult จากหน้า dualtaskResult.tsx
ถูกใช้โดย:dualtaskResult.tsx

--------------------------------------------------------------------------------------------------------------------
Page

dualtask.tsx
ไฟล์นี้คือหน้าเล่นเกมจริงของ Dual Task

หน้าที่หลัก:
แสดง header ของเกม
แสดงสนามเล่น
แสดง HUD ด้านบนในกรอบเกม เช่น เวลา, tracking accuracy, input accuracy
แสดง sequence overlay กลางสนาม
ให้ผู้เล่นคลิกในกรอบเพื่อเริ่มเล่น
เรียก useDualTaskGame() เพื่อควบคุมเกม
เมื่อเกมจบจะ redirect ไปหน้า result

ไฟล์นี้เชื่อมกับ:
useDualTaskGame.ts
DualTaskCanvas.tsx
SequenceOverlay.tsx

flow สำคัญคือ:
ผู้เล่นกดเริ่มในกรอบเกม
↓
dualtask.tsx เรียก startGame()
↓
useDualTaskGame.ts เริ่ม game loop
↓
DualTaskCanvas แสดง target และรับ mouse movement
↓
SequenceOverlay แสดง sequence
↓
เมื่อหมดเวลา useDualTaskGame สร้าง result
↓
dualtask.tsx navigate ไป dualtaskResult.tsx


dualtaskResult.tsx
ไฟล์นี้คือหน้าผลลัพธ์หลังจบเกม

หน้าที่หลัก:
รับ result จาก route state
ถ้าไม่มี route state จะดึงข้อมูลสำรองจาก localStorage
แสดงค่าสถิติหลังจบเกม
แสดง JSON output สำหรับ backend
มีปุ่มเล่นอีกครั้งและกลับไปหน้าข้อมูลเกม

ไฟล์นี้เชื่อมกับ:
MetricCard.tsx
ResultPanel.tsx
types.ts

*การใช้ localStorage ทำให้ถ้า refresh หน้า result แล้วข้อมูลล่าสุดยังไม่หายทันที

--------------------------------------------------------------------------------------------------------------------
Main Route Connection

import DualTaskGamePage from './Pages/gamepages/dualtask/dualtask'
import DualTaskResultPage from './Pages/gamepages/dualtask/dualtaskResult'

<Route path="/gameplay/dualtask" element={<DualTaskGamePage />} />
<Route path="/gameplay/dualtask/result" element={<DualTaskResultPage />} />

--------------------------------------------------------------------------------------------------------------------
Data Flow Summary

constants.ts
  ↓
engine files
  ↓
useDualTaskGame.ts
  ↓
dualtask.tsx
  ↓
DualTaskCanvas.tsx receives targetRef and pointerRef
SequenceOverlay.tsx receives activeSequence
  ↓
เมื่อเกมจบ
  ↓
useDualTaskGame.ts สร้าง DualTaskResult
  ↓
เก็บ latest_dual_task_result ใน localStorage
  ↓
navigate ไป dualtaskResult.tsx
  ↓
dualtaskResult.tsx แสดงผลและ JSON output