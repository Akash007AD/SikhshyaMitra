import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, CreditCard, PlayCircle, Calendar, TrendingUp, BookOpen, Sun, Shield, ArrowRight } from "lucide-react"

export default function Landing() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 lg:px-16 py-6 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900 font-serif">EduCore</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-slate-600">
          <a href="#" className="hover:text-slate-900 transition-colors">Product</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/login')} className="font-semibold text-slate-700 hover:text-slate-900 transition-colors hidden sm:block">
            Sign in
          </button>
          <Button onClick={() => navigate('/signup')} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 py-5 shadow-md font-serif">
            Get started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-36 lg:pt-48 pb-20 px-8 lg:px-16 max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        
        {/* Left Content */}
        <div className="max-w-xl z-10 animate-in slide-in-from-left-8 fade-in-0 duration-1000">
          <h1 className="text-5xl md:text-[5.5rem] font-medium tracking-tight leading-[1.05] mb-6 text-slate-900 font-serif">
            Run your school <br />
            with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">clarity.</span><br />
            <span className="text-slate-400">Every day.</span>
          </h1>
          
          <p className="text-lg text-slate-500 font-normal leading-relaxed mb-10 max-w-lg">
            EduCore is a modern, all-in-one school management system built for today's education. From admissions to academics to communication — everything in one simple, powerful platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button onClick={() => navigate('/signup')} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-7 text-lg font-medium shadow-xl shadow-slate-200 transition-all font-serif">
              Get started for free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 rounded-full px-8 py-7 text-lg font-medium border-slate-200 transition-all font-serif">
              <PlayCircle className="mr-2 w-5 h-5 text-slate-400" /> Watch demo
            </Button>
          </div>
        </div>

        {/* Right Floating Cards (Scattered UI) */}
        <div className="relative h-[500px] lg:h-[600px] w-full hidden md:block animate-in slide-in-from-right-12 fade-in-0 duration-1000 delay-200 font-sans">
          {/* Main Background Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/40 to-purple-100/40 rounded-full blur-3xl -z-10"></div>
          
          {/* Central Main Dashboard Mockup */}
          <div className="absolute top-4 right-12 w-[480px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-6 z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-xl text-slate-900 font-serif">Welcome back, Priya</h3>
                <p className="text-xs text-slate-500">Here's what's happening today.</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">P</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Students</p>
                <p className="font-bold text-2xl text-slate-800 font-serif">1,248</p>
                <p className="text-xs text-emerald-500 font-medium mt-1">↑ 12%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Attendance</p>
                <p className="font-bold text-2xl text-slate-800 font-serif">96%</p>
                <p className="text-xs text-emerald-500 font-medium mt-1">↑ 2%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Pending Fees</p>
                <p className="font-bold text-2xl text-slate-800 font-serif">24</p>
                <p className="text-xs text-rose-500 font-medium mt-1">↓ 18%</p>
              </div>
            </div>
            {/* Mock Chart Area */}
            <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-end justify-between p-4 px-6">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="w-8 bg-blue-200 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          {/* Scattered Floating Card 1: New Admissions */}
          <div className="absolute bottom-16 left-4 w-64 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1)] p-5 z-20 flex items-center gap-4 hover:-translate-y-2 transition-transform duration-500">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 font-serif">New Admissions</p>
              <p className="text-sm font-semibold text-emerald-500">+32 <span className="text-slate-400 font-medium">this month</span></p>
            </div>
          </div>

          {/* Scattered Floating Card 2: Fee Collection */}
          <div className="absolute -bottom-4 right-16 w-72 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] p-5 z-20 flex items-center justify-between hover:-translate-y-2 transition-transform duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Fee Collection</p>
                <p className="font-bold text-xl text-slate-900 font-serif">$12,480</p>
              </div>
            </div>
            <TrendingUp className="text-emerald-500 w-8 h-8 opacity-50" />
          </div>
        </div>
      </main>

      {/* Trust Section */}
      <section className="py-12 border-t border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 text-center">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-8">Trusted by progressive schools across India</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700 font-serif"><GraduationCap className="w-8 h-8"/> Greenfield Int.</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700 font-serif"><BookOpen className="w-8 h-8"/> Riverside Academy</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700 font-serif"><Sun className="w-8 h-8"/> Sunrise Public</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-700 font-serif"><Shield className="w-8 h-8"/> Maplewood High</div>
          </div>
        </div>
      </section>

      {/* Features Section - Scattered Cards */}
      <section className="py-24 px-8 lg:px-16 max-w-[1200px] mx-auto overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900 mb-6 font-serif">
            Everything you need.<br/>
            <span className="text-slate-400 italic">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-slate-500 font-normal">
            From daily operations to long-term growth, EduCore helps you manage every aspect of your school in one simple, connected platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          
          {/* Left Column (Shifted up) */}
          <div className="flex flex-col gap-8 md:-translate-y-12">
            {/* Card 1 */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 font-serif">Student Management</h3>
              <p className="text-slate-500 font-normal leading-relaxed">
                Complete student records, admissions, and information at your fingertips without the usual clutter.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 font-serif">Fees & Finance</h3>
              <p className="text-slate-500 font-normal leading-relaxed">
                Automate fee collection, generate beautiful receipts, and track dues effortlessly in real-time.
              </p>
            </div>
          </div>

          {/* Right Column (Shifted down) */}
          <div className="flex flex-col gap-8 md:translate-y-12">
            {/* Card 2 */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 font-serif">Academic Management</h3>
              <p className="text-slate-500 font-normal leading-relaxed">
                Manage classes, subjects, exams, and results with absolute ease and beautiful clarity.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 font-serif">Attendance</h3>
              <p className="text-slate-500 font-normal leading-relaxed">
                Track attendance in real-time with digital and intuitive register interfaces designed for speed.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <GraduationCap className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold text-lg text-slate-900 font-serif">EduCore</span>
          </div>
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduCore Technologies. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
