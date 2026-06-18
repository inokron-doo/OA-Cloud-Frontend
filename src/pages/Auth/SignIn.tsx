
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { SignInData } from "../../interface/auth/auth";
import { useNavigate, Link } from "react-router-dom";
import { IoEye, IoEyeOff } from "react-icons/io5";
import auth_img from "../../assets/auth_img.png"

import { loginUser } from "../../api/auth";

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInData>();

  const onSubmit = async (data: SignInData) => {
    try {
      const res = await loginUser(data);
      // console.log(res, "Full Response");

      // Robust token extraction
      const token =
        res.token ||
        res.access_token ||
        res.data?.token ||
        res.data?.access_token;
      const refreshToken = res.refresh_token || res.data?.refresh_token;

      if (token) {

        localStorage.setItem("access_token", token);
        // Store the refresh token so axios/the calendar guard can silently renew
        // the session instead of forcing a re-login when the access token ages out.
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        // NOTE: we deliberately do NOT set an access_token cookie here. The
        // backend sets an httponly access_token cookie (synced to the token's
        // lifetime) on /login/ and /token/refresh/; that single server-owned
        // cookie is what the Farm Calendar SSO uses.
        toast.success(res.message || "Login Successful!");
        navigate("/dashboard");
      } else {
        // console.warn("Login successful but no token found in response", res);
        // Depending on backend, maybe success is enough? But auth.ts checks localStorage.
        // If we don't have a token, we technically aren't "authenticated" for the frontend.
        toast.error("Login succeeded but failed to save session.");
      }
    } catch (error: any) {
      // console.error("Login Error:", error);
      toast.error(
        error?.response?.data?.error || "Login failed. Please try again."
      );
    }
  };



  return (
    <div className="h-screen bg-[#35EA471A]">
      <div className="flex flex-col md:flex-row w-full h-full gap-5">
        <div className="md:w-[50%] w-full p-10 md:p-7 lg:p-10">
          <div className="w-full h-full rounded-[48px] bg-white p-8">
            <div className="max-w-96 mx-auto flex flex-col justify-center h-full">
              <h2 className="mb-3 text-4xl font-medium text-[#202020]">Sign in</h2>
              <p className="text-sm font-medium text-[#202020] mb-5">
                New user? <Link to="/signup" className="text-[#00A63E]">Create an account</Link>
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Username Input Field */}
                <div className="relative">
                  <input
                    {...register("username", {
                      required: "Username is required",
                      // Change 2: Removed Email pattern/regex validation
                      minLength: {
                        value: 3,
                        message: "Username must be at least 3 characters"
                      }
                    })}
                    placeholder=""
                    className={`peer w-full border-b border-[#DCDBDD] py-1.5 outline-none text-sm text-[#202020] font-medium ${errors.username ? "border-red-500" : "border-gray-300"} focus:border-b-[#00A63E]`}
                  />
                  <label
                    className="absolute left-0 top-2 text-[#84818A] text-sm transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none"
                  >
                    Username
                  </label>
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: "Password is required" })}
                    placeholder=""
                    className={`peer w-full border-b border-[#DCDBDD] py-1.5 outline-none text-sm text-[#202020] font-medium ${errors.password ? "border-red-500" : "border-gray-300 focus:border-b-[#00A63E]"}`}
                  />
                  <label className="absolute left-0 top-2 text-[#84818A] text-sm transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:text-xs pointer-events-none">
                    Password
                  </label>
                  <div className="w-full mt-1">
                    <Link to="/forgot-password" className="text-right text-[#84818A] text-sm w-full block">
                      Forgot password?
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-2 text-xl text-[#84818A] hover:text-[#202020] cursor-pointer"
                  >
                    {showPassword ? <IoEye size={18} /> : <IoEyeOff size={18} />}
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm text-[#47464A]">Can't sign in?</h2>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="max-w-41 w-full px-1 py-3 bg-[#00A63E] rounded-xl text-sm font-medium text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Sign In"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Right Panel Image */}
        <div className="w-full h-full md:w-[50%] hidden md:flex">
          <img src={auth_img} alt="Img" loading="lazy" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
