import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { IoEye, IoEyeOff } from "react-icons/io5";
import auth_img from "../../assets/auth_img.png"
import { resetPassword } from '../../api/auth';

interface ResetPasswordFields {
    password: string;
}

function ResetPassword() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFields>();

    const onSubmit = async (data: ResetPasswordFields) => {
        try {
            const response = await resetPassword(data);
            toast.success(response.message || "Password reset successful!");
            navigate('/login');
        } catch (error: any) {
            console.error("Reset Password Error:", error);
            toast.error(error?.response?.data?.message || "Failed to reset password.");
        }
    };

    return (
        <div className="h-screen bg-[#35EA471A]">

            <div className="flex flex-col md:flex-row w-full h-full gap-5">

                {/* Left Panel */}
                <div className="md:w-[50%] w-full h-full p-10 md:p-7 lg:p-10">
                    <div className="w-full h-full rounded-[48px] bg-white p-8">
                        <div className="max-w-96 mx-auto flex flex-col justify-center h-full">
                            <h2 className="mb-3 text-4xl font-medium text-[#202020]">Reset password</h2>
                            <p className='text-sm font-medium text-[#202020] mb-8'>
                                Enter your new password to regain access to your account.
                            </p>
                            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                                {/* new password */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                                        })}
                                        placeholder=""
                                        className={`peer w-full border-b border-[#DCDBDD] py-1.5 outline-none text-sm text-[#202020] font-medium ${errors.password ? "border-red-500" : "border-gray-300 focus:border-b-[#00A63E]"}`}
                                    />
                                    <label className="absolute left-0 top-2 text-[#84818A] text-sm transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none">
                                        New Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-2 text-xl text-[#84818A] hover:text-[#202020] cursor-pointer"
                                    >
                                        {showPassword ? <IoEye size={18} /> : <IoEyeOff size={18} />}
                                    </button>
                                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full px-1 py-3 bg-[#00A63E] rounded-xl text-sm font-medium text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </>
                                    ) : (
                                        "Continue"
                                    )}
                                </button>

                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full h-full md:w-[50%] hidden md:flex">
                    <img src={auth_img} alt="Img" loading="lazy" className="w-full h-full object-cover" />
                </div>

            </div>

        </div>
    )
}

export default ResetPassword