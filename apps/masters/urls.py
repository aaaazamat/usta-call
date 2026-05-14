from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, MasterViewSet, MeMasterView, RegionViewSet, SkillViewSet

app_name = "masters"

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("skills", SkillViewSet, basename="skill")
router.register("regions", RegionViewSet, basename="region")
router.register("", MasterViewSet, basename="master")

me_view = MeMasterView.as_view({"get": "retrieve", "patch": "partial_update"})
me_portfolio = MeMasterView.as_view({"get": "portfolio_list", "post": "portfolio_create"})
me_portfolio_item = MeMasterView.as_view({"delete": "portfolio_delete"})

urlpatterns = [
    path("me/", me_view, name="me"),
    path("me/portfolio/", me_portfolio, name="me-portfolio"),
    path("me/portfolio/<int:item_id>/", me_portfolio_item, name="me-portfolio-item"),
    path("", include(router.urls)),
]
