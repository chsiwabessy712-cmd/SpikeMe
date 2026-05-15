from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name="home"),
    path('jf1/', views.jf1, name="jf1"),
    path('jf2/', views.jf2, name="jf2"),
    path('testing/', views.testing, name="testing"),
    path('jf1_2/', views.jf1_2, name="jf1_2"),
    path('jf1_3/', views.jf1_3, name="jf1_3"),
    path('jf1_4/', views.jf1_4, name="jf1_4"),
    path('jf1_5/', views.jf1_5, name="jf1_5"),
    path('jf1_6/', views.jf1_6, name="jf1_6"),
    path('jf1_7/', views.jf1_7, name="jf1_7"),
    path('jf1_8/', views.jf1_8, name="jf1_8"),
]