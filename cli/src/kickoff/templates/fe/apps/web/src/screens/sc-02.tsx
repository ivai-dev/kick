import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon } from "lucide-react";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  Combobox,
  Input,
  Label,
  PageHeader,
  Switch,
  Textarea,
  toast,
} from "@app/ui";
import { go } from "@kickoff/kit";

import { api } from "../lib/api";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-meta text-destructive">
      {message}
    </p>
  );
}

/** SC-02 New request — react-hook-form + zod, toast on submit, back to the list. */
export default function Screen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const owners = useQuery({ queryKey: ["owners"], queryFn: () => api.lookups.owners() });

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t("newRequest.errors.title")).max(200, t("newRequest.errors.title")),
        owner: z.string().min(1, t("newRequest.errors.owner")),
        amount: z.number({ error: t("newRequest.errors.amount") }).nonnegative(t("newRequest.errors.amount")),
        description: z.string().max(2000),
        submitNow: z.boolean(),
      }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", owner: "", amount: 0, description: "", submitNow: false },
  });
  const { errors, isSubmitting } = form.formState;

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      api.requests.create({
        title: values.title,
        owner: values.owner,
        amount: values.amount,
        description: values.description || undefined,
        status: values.submitNow ? "submitted" : "draft",
      }),
    onSuccess: async (created) => {
      toast.success(t("newRequest.created", { id: created.id }));
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
      void go("sc-01");
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        title={t("newRequest.title")}
        description={t("newRequest.description")}
        breadcrumb={
          <Button variant="link" className="-ml-3 self-start" onClick={() => go("sc-01")}>
            <ArrowLeftIcon aria-hidden />
            {t("newRequest.back")}
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form
            noValidate
            className="flex flex-col gap-(--density-gap)"
            onSubmit={form.handleSubmit((values) => create.mutateAsync(values))}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">{t("request.title")}</Label>
              <Input
                id="title"
                autoComplete="off"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : "title-hint"}
                {...form.register("title")}
              />
              {errors.title ? (
                <FieldError id="title-error" message={errors.title.message} />
              ) : (
                <p id="title-hint" className="text-meta text-muted-foreground">
                  {t("newRequest.titleHint")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label id="owner-label" htmlFor="owner">
                {t("request.owner")}
              </Label>
              <Controller
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <Combobox
                    id="owner"
                    aria-labelledby="owner-label"
                    aria-invalid={!!errors.owner}
                    aria-describedby={errors.owner ? "owner-error" : undefined}
                    options={(owners.data ?? []).map((name) => ({ value: name, label: name }))}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    placeholder={t("newRequest.ownerPlaceholder")}
                    searchPlaceholder={t("newRequest.ownerSearch")}
                    emptyText={t("newRequest.ownerEmpty")}
                  />
                )}
              />
              <FieldError id="owner-error" message={errors.owner?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">{t("request.amount")}</Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "amount-error" : undefined}
                {...form.register("amount", { valueAsNumber: true })}
              />
              <FieldError id="amount-error" message={errors.amount?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{t("request.description")}</Label>
              <Textarea id="description" rows={4} {...form.register("description")} />
            </div>

            <div className="flex items-center gap-3">
              <Controller
                control={form.control}
                name="submitNow"
                render={({ field }) => (
                  <Switch id="submitNow" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="submitNow">{t("newRequest.submitNow")}</Label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => go("sc-01")}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {t("newRequest.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
