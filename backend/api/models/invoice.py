from django.db import models


class Invoice(models.Model):
    date = models.DateTimeField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'

    def __str__(self):
        return f"Invoice {self.id} - {self.total}"


class Tag(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE)
    type = models.TextField()
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_lb = models.DecimalField(max_digits=10, decimal_places=2)
    fixed_cost = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tags'

    def __str__(self):
        return f"Tag {self.id} - {self.type}"