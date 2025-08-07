<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $apiKey = config('services.maps.api_key'); // atau hardcode 'your-api-key';
        return view('dashboard', compact('apiKey'));
    }
}
