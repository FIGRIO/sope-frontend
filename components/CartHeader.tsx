import Link from 'next/link';

interface CartHeaderProps {
    title: string;
    currentStep: 1 | 2 | 3;
}

export default function CartHeader({ title, currentStep }: CartHeaderProps) {
    const steps = [
        { id: 1, label: "Giỏ hàng" },
        { id: 2, label: "Thanh toán" },
        { id: 3, label: "Hoàn tất" },
    ];

    return (
        <header className="sticky top-0 z-50 flex h-[80px] w-full items-center bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] text-white shadow-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* === TRÁI: Logo & Tiêu đề trang === */}
                <div className="flex items-center gap-5">
                    <Link href="/" className="text-3xl font-extrabold tracking-tight hover:opacity-90 transition-opacity">
                        SOPE
                    </Link>
                    <div className="h-8 w-px bg-white/40"></div> {/* Đường kẻ dọc */}
                    <h1 className="text-xl font-medium tracking-wide">{title}</h1>
                </div>

                {/* === PHẢI: Thanh tiến trình (Stepper) === */}
                <div className="hidden items-center md:flex">
                    {steps.map((step, index) => {
                        const isActive = currentStep === step.id;
                        const isPast = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center">
                                {/* Từng bước (Step) */}
                                <div className={`flex items-center gap-2.5 transition-colors duration-300 ${isActive || isPast ? "text-white" : "text-white/50"}`}>
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300 ${isActive
                                                ? "bg-white text-[#EE4D2D] shadow-sm scale-110" // Bước hiện tại: Nền trắng, chữ cam, hơi to lên
                                                : isPast
                                                    ? "bg-white/30 text-white border border-white/50" // Đã qua: Nền mờ
                                                    : "border border-white/50 text-white/50" // Chưa tới: Viền mờ
                                            }`}
                                    >
                                        {isPast ? "✓" : step.id}
                                    </div>
                                    <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Đường kẻ ngang nối các bước */}
                                {index < steps.length - 1 && (
                                    <div className={`mx-4 h-[2px] w-12 rounded-full transition-colors duration-300 ${isPast ? "bg-white/80" : "bg-white/30"}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </header>
    );
}