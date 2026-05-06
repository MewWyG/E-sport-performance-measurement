import { AppButton } from '../../../../components/common/AppButton'

type NumberSearchReadyStateProps = {
  onStart: () => void
}

export function NumberSearchReadyState({
  onStart,
}: NumberSearchReadyStateProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-sp-card bg-sp-info-soft text-5xl shadow-sp-brand">
        🔢
      </div>

      <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
        ตามหาตัวเลข
      </h1>

      <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-sp-text-muted">
        คลิกตัวเลขเรียงจากน้อยไปมาก เล่นไปเรื่อย ๆ เป็น Level
        และพยายามอย่ากดผิดครบ 3 ครั้ง
      </p>

      <AppButton
        onClick={(event) => {
          event.stopPropagation()
          onStart()
        }}
        className="px-12 py-5 text-xl"
      >
        เริ่มเล่น
      </AppButton>
    </div>
  )
}