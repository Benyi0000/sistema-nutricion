from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0005_plantillapregunta_plantillaconsulta_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS user_plantillacategoria CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="ALTER TABLE IF EXISTS user_plantillapregunta DROP COLUMN IF EXISTS categoria_id CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]




