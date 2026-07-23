import {
  getOrderProgressSteps,
  getOrderStatusLabel,
  type OrderPaymentMethod,
  type OrderStatus,
} from "@/lib/order-status";

type OrderProgressProps = {
  status: OrderStatus;
  paymentMethod?: OrderPaymentMethod;
  compact?: boolean;
};

export default function OrderProgress({
  status,
  paymentMethod,
  compact = false,
}: OrderProgressProps) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-5 text-center text-rose-700">
        <p className="font-bold">Đơn hàng đã hủy</p>
        <p className="mt-1 text-xs">Tiến trình xử lý đã kết thúc.</p>
      </div>
    );
  }

  const steps = getOrderProgressSteps(status, paymentMethod);
  const currentStepIndex = Math.max(steps.indexOf(status as (typeof steps)[number]), 0);
  const progress =
    steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className={compact ? "py-2" : "overflow-x-auto py-4"}>
      <div className={compact ? "min-w-[520px]" : "min-w-[620px]"}>
        <div className="relative flex items-start justify-between">
          <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-slate-200" />
          <div
            className="absolute left-4 top-4 h-1 rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `calc((100% - 2rem) * ${progress / 100})` }}
          />

          {steps.map((step, index) => {
            const isReached = currentStepIndex >= index;
            const isCurrent = currentStepIndex === index;

            return (
              <div
                key={step}
                className="relative z-10 flex w-28 flex-col items-center text-center"
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-black ${
                    isReached
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isReached ? "✓" : index + 1}
                </div>
                <span
                  className={`mt-2 text-[11px] font-bold leading-4 ${
                    isReached ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {getOrderStatusLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
