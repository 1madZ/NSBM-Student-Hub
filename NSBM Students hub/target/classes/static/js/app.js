// State
let currentPage = 0;
const pageSize = 5;
let isEditing = false;

// DOM Elements
const tableBody = document.getElementById('student-table-body');
const modalOverlay = document.getElementById('student-modal');
const modalTitle = document.getElementById('modal-title');
const modalAlert = document.getElementById('modal-alert');
const studentForm = document.getElementById('student-form');
const paginationDiv = document.getElementById('pagination');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchStudents();
});

// Fetch Students
async function fetchStudents(page = 0) {
    try {
        const response = await fetch(`/api/students/paged?page=${page}&size=${pageSize}&sortBy=id&direction=desc`);
        if (response.ok) {
            const data = await response.json();
            renderTable(data.content);
            renderPagination(data);
            currentPage = page;
        } else if (response.status === 401 || response.status === 403) {
            window.location.href = '/login.html';
        } else {
            console.error('Failed to fetch students');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Render Table
function renderTable(students) {
    tableBody.innerHTML = '';

    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No students found. Add one!</td></tr>';
        return;
    }

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${student.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; background: #e0e7ff; color: #4338ca; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.8rem;">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    ${student.name}
                </div>
            </td>
            <td>${student.email}</td>
            <td><span class="chip" style="background: #f3f4f6;">${student.batch}</span></td>
            <td><span class="chip chip-gpa">${student.gpa.toFixed(2)}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-icon" onclick="editStudent(${student.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteStudent(${student.id})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Render Pagination
function renderPagination(data) {
    paginationDiv.innerHTML = '';

    if (data.totalPages <= 1) return;

    // Previous
    const prevBtn = createPageBtn('Prev', () => fetchStudents(currentPage - 1), data.first);
    paginationDiv.appendChild(prevBtn);

    // Page Numbers
    for (let i = 0; i < data.totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i + 1;
        pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : ''}`;
        pageBtn.style.padding = '0.5rem 1rem';
        pageBtn.style.background = i === currentPage ? 'var(--primary-color)' : 'white';
        pageBtn.style.color = i === currentPage ? 'white' : 'var(--text-color)';
        if (i !== currentPage) {
            pageBtn.onclick = () => fetchStudents(i);
        }
        paginationDiv.appendChild(pageBtn);
    }

    // Next
    const nextBtn = createPageBtn('Next', () => fetchStudents(currentPage + 1), data.last);
    paginationDiv.appendChild(nextBtn);
}

function createPageBtn(text, onClick, disabled) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'btn';
    btn.style.background = 'white';
    btn.disabled = disabled;
    if (disabled) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.onclick = onClick;
    }
    return btn;
}

// Modal Functions
function openModal() {
    isEditing = false;
    modalTitle.textContent = 'Add New Student';
    studentForm.reset();
    document.getElementById('student-id').value = '';
    modalAlert.style.display = 'none';
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

async function editStudent(id) {
    isEditing = true;
    modalTitle.textContent = 'Edit Student';
    modalAlert.style.display = 'none';

    try {
        const response = await fetch(`/api/students/${id}`);
        if (response.ok) {
            const student = await response.json();
            document.getElementById('student-id').value = student.id;
            document.getElementById('name').value = student.name;
            document.getElementById('email').value = student.email;
            document.getElementById('batch').value = student.batch;
            document.getElementById('gpa').value = student.gpa;
            modalOverlay.classList.add('active');
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
    }
}

// Form Submit
async function handleFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('student-id').value;
    const student = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        batch: document.getElementById('batch').value,
        gpa: parseFloat(document.getElementById('gpa').value)
    };

    const url = isEditing ? `/api/students/${id}` : '/api/students';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(student)
        });

        if (response.ok) {
            closeModal();
            fetchStudents(currentPage);
        } else {
            const error = await response.json(); // Assuming validation errors might return JSON
            modalAlert.textContent = 'Failed to save student. Email might be duplicate.';
            modalAlert.style.display = 'block';
        }
    } catch (error) {
        modalAlert.textContent = 'An error occurred. Please try again.';
        modalAlert.style.display = 'block';
    }
}

// Delete Student
async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchStudents(currentPage);
            } else {
                alert('Failed to delete student');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    }
}
