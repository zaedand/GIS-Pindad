<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ManageController extends Controller
{
    public function index()
    {
        // Ganti URL ini dengan alamat API PBX yang benar
        // $response = Http::get('http://192.168.196.235:3000/ext/status');

        // // Cek apakah respon berhasil
        // if ($response->successful()) {
        //     $statuses = $response->json();
        // } else {
        //     $statuses = []; // atau beri pesan error
        // }

        // Kirim data ke view
        // return view('manage', compact('statuses'));
        return view('manage');
    }
}
