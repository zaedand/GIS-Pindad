<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ManageController extends Controller
{
    public function index()
    {
        // Ambil API key dari .env supaya tidak hardcode
        $apiKey = env('SOCKET_KEY');

        return view('manage', compact('apiKey'));
    }
}
