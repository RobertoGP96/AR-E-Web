from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_add_expense_model'),
    ]

    # This migration is intentionally empty: the 'is_reimbursable' field was
    # not included in 0023_add_expense_model.py creation, so there is nothing
    # to remove here. Keeping this file avoids altering migration numbers.
    operations = []
