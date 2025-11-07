// College Management System - Main JavaScript File

class CollegeManagementSystem {
  constructor() {
    this.sidebarCollapsed = false
    this.darkMode = localStorage.getItem("darkMode") === "true"
    this.currentUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null
    this.users = JSON.parse(localStorage.getItem("users")) || []

    this.students = JSON.parse(localStorage.getItem("students")) || []
    this.teachers = JSON.parse(localStorage.getItem("teachers")) || []
    this.courses = JSON.parse(localStorage.getItem("courses")) || []
    this.attendance = JSON.parse(localStorage.getItem("attendance")) || []
    this.grades = JSON.parse(localStorage.getItem("grades")) || []

    this.editingStudentId = null
    this.editingTeacherId = null
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.applyTheme()
    this.setupAuthenticationHandlers()
    this.setupDataHandlers()
    this.loadInitialPage()
  }

  setupEventListeners() {
    const menuToggle = document.getElementById("menuToggle")
    menuToggle.addEventListener("click", () => this.toggleSidebar())

    const navItems = document.querySelectorAll(".nav-item")
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => this.handleNavigation(e))
    })

    const themeToggle = document.getElementById("themeToggle")
    themeToggle.addEventListener("click", () => this.toggleTheme())

    document.addEventListener("click", (e) => this.handleMobileMenuClose(e))
  }

  setupAuthenticationHandlers() {
    const loginForm = document.getElementById("loginForm")
    const signupForm = document.getElementById("signupForm")
    const signupToggle = document.getElementById("signupToggle")
    const loginToggle = document.getElementById("loginToggle")

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e))
    }

    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e))
    }

    if (signupToggle) {
      signupToggle.addEventListener("click", () => this.toggleAuthPage())
    }

    if (loginToggle) {
      loginToggle.addEventListener("click", () => this.toggleAuthPage())
    }
  }

  setupDataHandlers() {
    const addStudentBtn = document.getElementById("addStudentBtn")
    if (addStudentBtn) {
      addStudentBtn.addEventListener("click", () => this.openStudentModal())
    }

    const studentForm = document.getElementById("studentForm")
    if (studentForm) {
      studentForm.addEventListener("submit", (e) => this.handleSaveStudent(e))
    }

    const studentSearchInput = document.getElementById("studentSearchInput")
    if (studentSearchInput) {
      studentSearchInput.addEventListener("input", (e) => this.filterStudents(e.target.value))
    }

    const addTeacherBtn = document.getElementById("addTeacherBtn")
    if (addTeacherBtn) {
      addTeacherBtn.addEventListener("click", () => this.openTeacherModal())
    }

    const teacherForm = document.getElementById("teacherForm")
    if (teacherForm) {
      teacherForm.addEventListener("submit", (e) => this.handleSaveTeacher(e))
    }

    const teacherSearchInput = document.getElementById("teacherSearchInput")
    if (teacherSearchInput) {
      teacherSearchInput.addEventListener("input", (e) => this.filterTeachers(e.target.value))
    }

    const attendanceDateInput = document.getElementById("attendanceDateInput")
    if (attendanceDateInput) {
      attendanceDateInput.addEventListener("change", () => this.loadAttendanceForDate())
      attendanceDateInput.valueAsDate = new Date()
    }

    const attendanceCourseSelect = document.getElementById("attendanceCourseSelect")
    if (attendanceCourseSelect) {
      attendanceCourseSelect.addEventListener("change", () => this.loadAttendanceForDate())
      this.populateCourseSelect()
    }
  }

  populateCourseSelect() {
    const select = document.getElementById("attendanceCourseSelect")
    if (!select) return

    const courses = ["CS101", "BUS201", "ENG301"]
    courses.forEach((course) => {
      if (!Array.from(select.options).some((opt) => opt.value === course)) {
        const option = document.createElement("option")
        option.value = course
        option.textContent = course
        select.appendChild(option)
      }
    })
  }

  loadAttendanceForDate() {
    const dateInput = document.getElementById("attendanceDateInput")
    const courseSelect = document.getElementById("attendanceCourseSelect")

    if (!dateInput || !courseSelect) return

    const date = dateInput.value
    const course = courseSelect.value

    if (!date || !course) {
      document.getElementById("attendanceTableBody").innerHTML = ""
      return
    }

    const tbody = document.getElementById("attendanceTableBody")
    tbody.innerHTML = ""

    this.students
      .filter((s) => s.course === course)
      .forEach((student) => {
        const attendanceKey = `${date}-${student.id}`
        const attendanceRecord = this.attendance.find((a) => a.key === attendanceKey)
        const status = attendanceRecord ? attendanceRecord.status : "absent"

        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${student.firstName} ${student.lastName}</td>
          <td>${student.id}</td>
          <td>
            <select onchange="cms.markAttendance('${student.id}', '${date}', this.value)">
              <option value="present" ${status === "present" ? "selected" : ""}>Present</option>
              <option value="absent" ${status === "absent" ? "selected" : ""}>Absent</option>
              <option value="leave" ${status === "leave" ? "selected" : ""}>Leave</option>
            </select>
          </td>
        `
        tbody.appendChild(row)
      })

    if (this.students.filter((s) => s.course === course).length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align: center; padding: 2rem;">No students found for this course.</td></tr>'
    }
  }

  markAttendance(studentId, date, status) {
    const attendanceKey = `${date}-${studentId}`
    const existingIndex = this.attendance.findIndex((a) => a.key === attendanceKey)

    if (existingIndex >= 0) {
      this.attendance[existingIndex].status = status
    } else {
      this.attendance.push({ key: attendanceKey, studentId, date, status })
    }

    localStorage.setItem("attendance", JSON.stringify(this.attendance))
    console.log("[v0] Attendance marked:", { studentId, date, status })
  }

  openStudentModal(studentId = null) {
    const modal = document.getElementById("studentModal")
    const form = document.getElementById("studentForm")
    form.reset()
    this.editingStudentId = studentId

    if (studentId) {
      const student = this.students.find((s) => s.id === studentId)
      if (student) {
        document.getElementById("studentFirstName").value = student.firstName
        document.getElementById("studentLastName").value = student.lastName
        document.getElementById("studentEmail").value = student.email
        document.getElementById("studentPhone").value = student.phone
        document.getElementById("studentCourse").value = student.course
      }
    }

    modal.classList.add("active")
  }

  handleSaveStudent(e) {
    e.preventDefault()

    const student = {
      id: this.editingStudentId || "STU" + Date.now(),
      firstName: document.getElementById("studentFirstName").value,
      lastName: document.getElementById("studentLastName").value,
      email: document.getElementById("studentEmail").value,
      phone: document.getElementById("studentPhone").value,
      course: document.getElementById("studentCourse").value,
      enrollmentDate: new Date().toISOString().split("T")[0],
    }

    if (this.editingStudentId) {
      const index = this.students.findIndex((s) => s.id === this.editingStudentId)
      this.students[index] = student
    } else {
      this.students.push(student)
    }

    localStorage.setItem("students", JSON.stringify(this.students))
    this.renderStudents()
    document.getElementById("studentModal").classList.remove("active")
    console.log("[v0] Student saved:", student)
  }

  filterStudents(searchTerm) {
    const rows = document.querySelectorAll("#studentTableBody tr")
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase()
      row.style.display = text.includes(searchTerm.toLowerCase()) ? "" : "none"
    })
  }

  deleteStudent(studentId) {
    if (confirm("Are you sure you want to delete this student?")) {
      this.students = this.students.filter((s) => s.id !== studentId)
      localStorage.setItem("students", JSON.stringify(this.students))
      this.renderStudents()
      console.log("[v0] Student deleted:", studentId)
    }
  }

  renderStudents() {
    const tbody = document.getElementById("studentTableBody")
    tbody.innerHTML = ""

    if (this.students.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No students found. Add a new student to get started.</td></tr>'
      return
    }

    this.students.forEach((student) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.firstName} ${student.lastName}</td>
        <td>${student.email}</td>
        <td>${student.phone}</td>
        <td>${student.course}</td>
        <td>${student.enrollmentDate}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-view" onclick="cms.openStudentModal('${student.id}')">Edit</button>
            <button class="btn-delete" onclick="cms.deleteStudent('${student.id}')">Delete</button>
          </div>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  openTeacherModal(teacherId = null) {
    const modal = document.getElementById("teacherModal")
    const form = document.getElementById("teacherForm")
    form.reset()
    this.editingTeacherId = teacherId

    if (teacherId) {
      const teacher = this.teachers.find((t) => t.id === teacherId)
      if (teacher) {
        document.getElementById("teacherFirstName").value = teacher.firstName
        document.getElementById("teacherLastName").value = teacher.lastName
        document.getElementById("teacherEmail").value = teacher.email
        document.getElementById("teacherSubject").value = teacher.subject
        document.getElementById("teacherDepartment").value = teacher.department
        document.getElementById("teacherQualification").value = teacher.qualification
      }
    }

    modal.classList.add("active")
  }

  handleSaveTeacher(e) {
    e.preventDefault()

    const teacher = {
      id: this.editingTeacherId || "TEACH" + Date.now(),
      firstName: document.getElementById("teacherFirstName").value,
      lastName: document.getElementById("teacherLastName").value,
      email: document.getElementById("teacherEmail").value,
      subject: document.getElementById("teacherSubject").value,
      department: document.getElementById("teacherDepartment").value,
      qualification: document.getElementById("teacherQualification").value,
    }

    if (this.editingTeacherId) {
      const index = this.teachers.findIndex((t) => t.id === this.editingTeacherId)
      this.teachers[index] = teacher
    } else {
      this.teachers.push(teacher)
    }

    localStorage.setItem("teachers", JSON.stringify(this.teachers))
    this.renderTeachers()
    document.getElementById("teacherModal").classList.remove("active")
    console.log("[v0] Teacher saved:", teacher)
  }

  filterTeachers(searchTerm) {
    const rows = document.querySelectorAll("#teacherTableBody tr")
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase()
      row.style.display = text.includes(searchTerm.toLowerCase()) ? "" : "none"
    })
  }

  deleteTeacher(teacherId) {
    if (confirm("Are you sure you want to delete this teacher?")) {
      this.teachers = this.teachers.filter((t) => t.id !== teacherId)
      localStorage.setItem("teachers", JSON.stringify(this.teachers))
      this.renderTeachers()
      console.log("[v0] Teacher deleted:", teacherId)
    }
  }

  renderTeachers() {
    const tbody = document.getElementById("teacherTableBody")
    tbody.innerHTML = ""

    if (this.teachers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No teachers found. Add a new teacher to get started.</td></tr>'
      return
    }

    this.teachers.forEach((teacher) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${teacher.id}</td>
        <td>${teacher.firstName} ${teacher.lastName}</td>
        <td>${teacher.email}</td>
        <td>${teacher.subject}</td>
        <td>${teacher.department}</td>
        <td>${teacher.qualification}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-view" onclick="cms.openTeacherModal('${teacher.id}')">Edit</button>
            <button class="btn-delete" onclick="cms.deleteTeacher('${teacher.id}')">Delete</button>
          </div>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  handleLogin(e) {
    e.preventDefault()

    const role = document.getElementById("loginRole").value
    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    if (!email || !password) {
      alert("Please fill in all fields")
      return
    }

    const user = this.users.find((u) => u.email === email && u.password === password && u.role === role)

    if (user) {
      this.currentUser = { email: user.email, role: user.role, name: user.name }
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
      this.updateUIForLoggedInUser()
      this.showPage("dashboard")
      console.log("[v0] User logged in:", this.currentUser)
    } else {
      alert("Invalid credentials. Try: admin@college.com / password123")
    }
  }

  handleSignup(e) {
    e.preventDefault()

    const role = document.getElementById("signupRole").value
    const name = document.getElementById("signupName").value
    const email = document.getElementById("signupEmail").value
    const password = document.getElementById("signupPassword").value
    const confirmPassword = document.getElementById("signupConfirmPassword").value

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    if (this.users.find((u) => u.email === email)) {
      alert("Email already registered")
      return
    }

    const newUser = { name, email, password, role }
    this.users.push(newUser)
    localStorage.setItem("users", JSON.stringify(this.users))

    this.currentUser = { email: newUser.email, role: newUser.role, name: newUser.name }
    localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
    this.updateUIForLoggedInUser()
    this.showPage("dashboard")
    alert("Account created successfully!")
  }

  toggleAuthPage() {
    const loginPage = document.getElementById("login-page")
    const signupPage = document.getElementById("signup-page")

    if (loginPage.style.display === "none") {
      loginPage.style.display = "flex"
      signupPage.style.display = "none"
    } else {
      loginPage.style.display = "none"
      signupPage.style.display = "flex"
    }
  }

  updateUIForLoggedInUser() {
    const profileName = document.querySelector(".profile-name")
    const profileAvatar = document.querySelector(".profile-avatar")

    if (this.currentUser) {
      const initials = this.currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

      if (profileName) {
        profileName.textContent = this.currentUser.name.split(" ")[0]
      }
      if (profileAvatar) {
        profileAvatar.textContent = initials.slice(0, 2)
      }
    }
  }

  toggleSidebar() {
    const sidebar = document.querySelector(".sidebar")
    const windowWidth = window.innerWidth

    if (windowWidth <= 768) {
      sidebar.classList.toggle("active")
    } else {
      sidebar.classList.toggle("collapsed")
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }

  handleNavigation(e) {
    e.preventDefault()
    const navItem = e.currentTarget
    const pageName = navItem.getAttribute("data-page")

    if (pageName === "login") {
      this.logout()
      return
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active")
    })
    navItem.classList.add("active")

    this.showPage(pageName)

    if (window.innerWidth <= 768) {
      document.querySelector(".sidebar").classList.remove("active")
    }
  }

  logout() {
    localStorage.removeItem("currentUser")
    this.currentUser = null
    this.showPage("login")
    console.log("[v0] User logged out")
  }

  showPage(pageName) {
    document.querySelectorAll(".page-section").forEach((section) => {
      section.classList.remove("active")
    })

    const pageElement = document.getElementById(`${pageName}-page`)
    if (pageElement) {
      pageElement.classList.add("active")
    }

    if (pageName === "students") {
      this.renderStudents()
    } else if (pageName === "teachers") {
      this.renderTeachers()
    } else if (pageName === "grades") {
      this.renderGrades()
    } else if (pageName === "attendance") {
      this.loadAttendanceForDate()
    }
  }

  renderGrades() {
    const tbody = document.getElementById("gradesTableBody")
    if (!tbody) return

    tbody.innerHTML = ""

    if (this.grades.length === 0) {
      this.generateSampleGrades()
    }

    const courses = ["CS101", "BUS201", "ENG301"]
    let gradeCount = 0

    this.students.forEach((student) => {
      const courseMarks = this.grades.find((g) => g.studentId === student.id && g.course === student.course)
      const marks = courseMarks ? courseMarks.marks : Math.floor(Math.random() * 40) + 60
      const grade = this.calculateGrade(marks)

      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${student.firstName} ${student.lastName}</td>
        <td>${student.course}</td>
        <td>${marks}</td>
        <td>${grade}</td>
        <td>${marks >= 40 ? '<span style="color: var(--success);">Pass</span>' : '<span style="color: var(--error);">Fail</span>'}</td>
      `
      tbody.appendChild(row)
      gradeCount++
    })

    if (gradeCount === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No grades found.</td></tr>'
    }
  }

  generateSampleGrades() {
    this.students.forEach((student) => {
      const marks = Math.floor(Math.random() * 40) + 60
      this.grades.push({
        studentId: student.id,
        course: student.course,
        marks: marks,
      })
    })
    localStorage.setItem("grades", JSON.stringify(this.grades))
  }

  calculateGrade(marks) {
    if (marks >= 90) return "A+"
    if (marks >= 80) return "A"
    if (marks >= 70) return "B+"
    if (marks >= 60) return "B"
    if (marks >= 50) return "C"
    if (marks >= 40) return "D"
    return "F"
  }

  toggleTheme() {
    this.darkMode = !this.darkMode
    localStorage.setItem("darkMode", this.darkMode)
    this.applyTheme()
  }

  applyTheme() {
    const body = document.body
    const themeToggle = document.getElementById("themeToggle")

    if (this.darkMode) {
      body.classList.add("dark-mode")
      themeToggle.textContent = "☀️"
    } else {
      body.classList.remove("dark-mode")
      themeToggle.textContent = "🌙"
    }
  }

  handleMobileMenuClose(e) {
    const sidebar = document.querySelector(".sidebar")
    const menuToggle = document.getElementById("menuToggle")

    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("active")
      }
    }
  }

  loadInitialPage() {
    if (this.currentUser) {
      this.updateUIForLoggedInUser()
      this.showPage("dashboard")
      console.log("[v0] User session restored:", this.currentUser)
    } else {
      this.initializeDemoData()
      this.showPage("login")
    }
  }

  initializeDemoData() {
    if (this.users.length === 0) {
      this.users = [
        { name: "Admin User", email: "admin@college.com", password: "password123", role: "admin" },
        { name: "John Doe", email: "student@college.com", password: "password123", role: "student" },
        { name: "Jane Smith", email: "teacher@college.com", password: "password123", role: "teacher" },
      ]
      localStorage.setItem("users", JSON.stringify(this.users))
    }

    if (this.students.length === 0) {
      this.students = [
        {
          id: "STU001",
          firstName: "Raj",
          lastName: "Kumar",
          email: "raj@college.com",
          phone: "9876543210",
          course: "CS101",
          enrollmentDate: "2024-01-15",
        },
        {
          id: "STU002",
          firstName: "Priya",
          lastName: "Singh",
          email: "priya@college.com",
          phone: "9876543211",
          course: "BUS201",
          enrollmentDate: "2024-02-10",
        },
        {
          id: "STU003",
          firstName: "Amit",
          lastName: "Patel",
          email: "amit@college.com",
          phone: "9876543212",
          course: "ENG301",
          enrollmentDate: "2024-01-20",
        },
        {
          id: "STU004",
          firstName: "Neha",
          lastName: "Gupta",
          email: "neha@college.com",
          phone: "9876543213",
          course: "CS101",
          enrollmentDate: "2024-03-05",
        },
        {
          id: "STU005",
          firstName: "Vikram",
          lastName: "Sharma",
          email: "vikram@college.com",
          phone: "9876543214",
          course: "BUS201",
          enrollmentDate: "2024-02-18",
        },
      ]
      localStorage.setItem("students", JSON.stringify(this.students))
    }

    if (this.teachers.length === 0) {
      this.teachers = [
        {
          id: "TEACH001",
          firstName: "Dr.",
          lastName: "Sharma",
          email: "sharma@college.com",
          subject: "Mathematics",
          department: "CS",
          qualification: "PhD",
        },
        {
          id: "TEACH002",
          firstName: "Prof.",
          lastName: "Gupta",
          email: "gupta@college.com",
          subject: "Physics",
          department: "ENGG",
          qualification: "M.Tech",
        },
        {
          id: "TEACH003",
          firstName: "Mrs.",
          lastName: "Verma",
          email: "verma@college.com",
          subject: "Economics",
          department: "BUS",
          qualification: "MBA",
        },
        {
          id: "TEACH004",
          firstName: "Mr.",
          lastName: "Singh",
          email: "singh@college.com",
          subject: "Programming",
          department: "CS",
          qualification: "B.Tech",
        },
      ]
      localStorage.setItem("teachers", JSON.stringify(this.teachers))
    }

    console.log("[v0] Demo data initialized")
  }
}

const cms = new CollegeManagementSystem()

document.addEventListener("DOMContentLoaded", () => {
  // cms instance already created above
})
