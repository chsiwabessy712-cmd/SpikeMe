from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return render(request, 'index.html')

def jf1(request):
    return render(request, 'jf1.html', {'active_lesson': 1})

def jf2(request):
    return render(request, 'jf2.html')

def testing(request):
    return render(request,'testing.html')

def jf1_2(request):
    return render(request,'jf1_2.html', {'active_lesson': 2})

def jf1_3(request):
    return render(request,'jf1_3.html', {'active_lesson': 3})

def jf1_4(request):
    return render(request,'jf1_4.html', {'active_lesson': 4})

def jf1_5(request):
    return render(request,'jf1_5.html', {'active_lesson': 5})

def jf1_6(request):
    return render(request,'jf1_6.html', {'active_lesson': 6})

def jf1_7(request):
    return render(request,'jf1_7.html', {'active_lesson': 7})
# Create your views here.
