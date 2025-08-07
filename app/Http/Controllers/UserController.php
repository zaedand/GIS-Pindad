<?php
namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::latest()->get(); // atau tambahkan paginate kalau mau paging
        return view('users', compact('users'));
    }
}
