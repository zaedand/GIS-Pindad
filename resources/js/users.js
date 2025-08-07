document.addEventListener('DOMContentLoaded', () => {
    const app = window.appData;

    const filterUsers = () => {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const rows = document.querySelectorAll('#usersTable tbody tr');

        rows.forEach(row => {
            const name = row.cells[1].textContent.toLowerCase();
            const email = row.cells[2].textContent.toLowerCase();
            row.style.display = (name.includes(searchTerm) || email.includes(searchTerm)) ? '' : 'none';
        });
    };

    const resetFilter = () => {
        document.getElementById('userSearch').value = '';
        document.querySelectorAll('#usersTable tbody tr').forEach(row => row.style.display = '');
    };

    document.getElementById('userSearch').addEventListener('keyup', e => {
        if (e.key === 'Enter') filterUsers();
    });

    window.filterUsers = filterUsers;
    window.resetFilter = resetFilter;

    window.openModal = () => {
        document.getElementById('modal-title').textContent = 'Tambah User Baru';
        document.getElementById('userForm').action = app.routes.storeUser;
        document.getElementById('method-field').innerHTML = '';
        document.getElementById('submit-btn').textContent = 'Simpan';
        document.getElementById('password-section').style.display = 'block';
        document.getElementById('userPassword').required = true;
        document.getElementById('userPasswordConfirm').required = true;
        document.getElementById('userForm').reset();
        document.getElementById('userModal').classList.remove('hidden');
    };

    window.editUser = (userId) => {
        fetch(`${app.routes.editUser}/${userId}/edit`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': app.csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('modal-title').textContent = 'Edit User';
            document.getElementById('userForm').action = `${app.routes.updateUser}/${userId}/update`;
            document.getElementById('method-field').innerHTML = '<input type="hidden" name="_method" value="PUT">';
            document.getElementById('submit-btn').textContent = 'Update';
            document.getElementById('password-section').style.display = 'none';
            document.getElementById('userPassword').required = false;
            document.getElementById('userPasswordConfirm').required = false;

            document.getElementById('userName').value = data.name;
            document.getElementById('userEmail').value = data.email;
            document.getElementById('userRole').value = data.role || 'user';

            document.getElementById('userModal').classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memuat data user');
        });
    };

    window.closeModal = () => {
        document.getElementById('userModal').classList.add('hidden');
        document.getElementById('userForm').reset();
    };

    window.confirmDelete = (userName) => {
        return confirm(`Apakah Anda yakin ingin menghapus user "${userName}"? Tindakan ini tidak dapat dibatalkan.`);
    };

    document.getElementById('userModal').addEventListener('click', function(e) {
        if (e.target === this) {
            window.closeModal();
        }
    });
});
