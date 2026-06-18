import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { RegisterData } from '../../interface/auth/auth';
import { registerUser } from '../../api/auth'
import { useNavigate, Link } from 'react-router-dom';
import { IoEye, IoEyeOff } from "react-icons/io5";
import auth_img from "../../assets/auth_img.png"

const Register = () => {

    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);


    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterData>();

    const onSubmit = async (data: RegisterData) => {
        try {
            const res = await registerUser(data);

            toast.success(res.message || "Registration successful");
            navigate("/login"); // public route
        } catch (error: any) {
            toast.error(
                error?.response?.data?.error || "Something went wrong"
            );
        }
    };

    return (
        <div className="h-screen bg-[#35EA471A]">

            <div className="flex flex-col md:flex-row w-full h-full gap-5">

                {/* Left Panel */}
                <div className="md:w-[50%] w-full h-full p-10 md:p-7 lg:p-10">
                    <div className="w-full h-full rounded-[48px] bg-white p-8">
                        <div className="max-w-96 mx-auto flex flex-col justify-center h-full">
                            <h2 className="mb-3 text-4xl font-medium text-[#202020]">Create Account</h2>
                            <p className='text-sm font-medium text-[#202020] mb-5'>
                                Already user? {" "}
                                <Link to="/login" className='text-[#00A63E]'>Account</Link>
                            </p>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                <div className='relative'>
                                    <input
                                        {...register("username", { required: "Username is required" })}
                                        placeholder=""
                                        className={`peer w-full border-b border-[#DCDBDD] py-1.5 outline-none text-sm text-[#202020] font-medium ${errors.username ? 'border-red-500' : 'border-gray-300'} focus:border-b-[#00A63E]`}
                                    />
                                    <label
                                        className="absolute left-0 top-2 text-[#84818A] text-sm transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                                    >
                                        User Name
                                    </label>
                                    {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
                                </div>

                                <div className='relative'>
                                    <input
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                                        })}
                                        placeholder=""
                                        className={`peer w-full border-b border-[#DCDBDD] py-1.5 outline-none text-sm text-[#202020] font-medium ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:border-b-[#00A63E]`}
                                    />
                                    <label
                                        className="absolute left-0 top-2 text-[#84818A] text-sm transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                                    >
                                        Email Address
                                    </label>
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                                </div>

                                <div className='relative'>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Minimum 6 characters required" }
                                        })}
                                        placeholder=""
                                        className={`peer w-full border-b border-[#DCDBDD] py-1.5 outline-none text-sm text-[#202020] font-medium ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:border-b-[#00A63E]`}
                                    />
                                    <label
                                        className="absolute left-0 top-2 text-[#84818A] text-sm transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none">
                                        Password
                                    </label>

                                    {/* Toggle Eye Icon */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-2 text-xl text-[#84818A] hover:text-[#202020] cursor-pointer"
                                    >
                                        {/* Default (false) par IoEyeOff (closed) dikhega */}
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
                                        "Sign Up"
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
    );
};

export default Register;