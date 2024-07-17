import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Disclosure } from "@headlessui/react";
import { IWorkspaceMember } from "@plane/types";
import { EUserProjectRoles } from "@plane/types/src/enums";
import { PopoverMenu, CustomSelect, setToast, TOAST_TYPE } from "@plane/ui";
import { EUserWorkspaceRoles, ROLE } from "@/constants/workspace";
import { useMember, useUser } from "@/hooks/store";

interface RowData {
  member: IWorkspaceMember;
  role: EUserWorkspaceRoles;
}

const useMemberColumns = () => {
  console.log("");
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  const { workspaceSlug } = useParams();
  const {
    workspace: { updateMember },
  } = useMember();
  const {
    membership: { currentWorkspaceRole },
    data: currentUser,
  } = useUser();

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  const columns = [
    {
      key: "Full Name",
      content: "Full Name",
      thClassName: "text-left",
      tdRender: (rowData: RowData) => (
        <Disclosure>
          {({}) => (
            <div className="relative group">
              <div className="flex items-center gap-x-4 gap-y-2 w-72 justify-between">
                <div className="flex items-center gap-x-4 gap-y-2 flex-1">
                  {rowData.member.avatar && rowData.member.avatar.trim() !== "" ? (
                    <Link href={`/${workspaceSlug}/profile/${rowData.member.id}`}>
                      <span className="relative flex h-6 w-6 items-center justify-center rounded-full p-4 capitalize text-white">
                        <img
                          src={rowData.member.avatar}
                          className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                          alt={rowData.member.display_name || rowData.member.email}
                        />
                      </span>
                    </Link>
                  ) : (
                    <Link href={`/${workspaceSlug}/profile/${rowData.member.id}`}>
                      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 p-4 capitalize text-white">
                        {(rowData.member.email ?? rowData.member.display_name ?? "?")[0]}
                      </span>
                    </Link>
                  )}
                  {rowData.member.first_name} {rowData.member.last_name}
                </div>

                {(isAdmin || rowData.member?.id === currentUser?.id) && (
                  <PopoverMenu
                    data={[""]}
                    keyExtractor={(item) => item}
                    popoverClassName="justify-end"
                    buttonClassName="outline-none	origin-center rotate-90 size-8 aspect-square flex-shrink-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    render={() => (
                      <div
                        className="flex items-center gap-x-3 cursor-pointer"
                        onClick={() => setRemoveMemberModal(rowData)}
                      >
                        <Trash2 className="size-3.5 align-middle" />{" "}
                        {rowData.member?.id === currentUser?.id ? "Leave " : "Remove "}
                      </div>
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </Disclosure>
      ),
    },
    {
      key: "Display Name",
      content: "Display Name",
      tdRender: (rowData: RowData) => <div className="w-32">{rowData.member.display_name}</div>,
    },

    {
      key: "Account Type",
      content: "Account Type",
      tdRender: (rowData: RowData) =>
        rowData.role === EUserWorkspaceRoles.ADMIN || currentWorkspaceRole !== EUserWorkspaceRoles.ADMIN ? (
          <div className="w-32 flex ">
            <span>{ROLE[rowData.role as keyof typeof ROLE]}</span>
          </div>
        ) : (
          <Controller
            name="role"
            control={control}
            rules={{ required: "Role is required." }}
            render={({ field: { value } }) => (
              <CustomSelect
                value={value}
                onChange={(value: EUserProjectRoles) => {
                  console.log({ value, workspaceSlug }, "onChange");
                  if (!workspaceSlug) return;

                  updateMember(workspaceSlug.toString(), rowData.member.id, {
                    role: value as unknown as EUserWorkspaceRoles, // Cast value to unknown first, then to EUserWorkspaceRoles
                  }).catch((err) => {
                    console.log(err, "err");
                    const error = err.error;
                    const errorString = Array.isArray(error) ? error[0] : error;

                    setToast({
                      type: TOAST_TYPE.ERROR,
                      title: "Error!",
                      message: errorString ?? "An error occurred while updating member role. Please try again.",
                    });
                  });
                }}
                label={
                  <div className="flex ">
                    <span>{ROLE[rowData.role as keyof typeof ROLE]}</span>
                  </div>
                }
                buttonClassName={`!px-0 !justify-start hover:bg-custom-background-100 ${errors.role ? "border-red-500" : "border-none"}`}
                className="rounded-md p-0 w-32"
                optionsClassName="w-full"
                input
              >
                {Object.keys(ROLE).map((item) => (
                  <CustomSelect.Option key={item} value={item as unknown as EUserProjectRoles}>
                    {ROLE[item as unknown as keyof typeof ROLE]}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            )}
          />
        ),
    },
    // {
    //   key: "Billing Status",
    //   content: "Billing Status",
    //   tdRender: (rowData: RowData) => (
    //     <div className="w-36">{rowData.role < EUserWorkspaceRoles.MEMBER ? "Inactive" : "Active"}</div>
    //   ),
    // },
    {
      key: "Joining Date",
      content: "Joining Date",
      tdRender: (rowData: RowData) => <div>{getFormattedDate(rowData.member.joining_date)}</div>,
    },
  ];
  return { columns, workspaceSlug, removeMemberModal, setRemoveMemberModal };
};

export default useMemberColumns;
