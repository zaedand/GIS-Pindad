<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LogsController extends Controller
{
    public function index()
    {
        $apiKey = env('SOCKET_KEY'); 
        return view('logs', compact('apiKey'));
    }
}
