<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $apiKey = env('SOCKET_KEY');
        return view('dashboard', compact('apiKey'));
    }
}
